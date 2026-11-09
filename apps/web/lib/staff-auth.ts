// Вход сотрудников в панель управления (/admin).
// Токен сотрудника хранится отдельно от токена покупателя (accessToken),
// поэтому можно быть одновременно залогиненным на сайте и в админке.

const API_URL   = process.env.NEXT_PUBLIC_API_URL;
const TOKEN_KEY = 'staffToken';

export type StaffRole = 'manager' | 'admin';

export interface StaffUser {
  id:    number;
  email: string;
  name:  string | null;
  role:  StaffRole;
}

export const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  manager: 'Менеджер',
  admin:   'Администратор',
};

/** Ошибка «нужно войти заново»: токена нет, он истёк или у пользователя забрали роль */
export class StaffAuthError extends Error {}

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearStaffToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // хранилище недоступно — токена там и так нет
  }
}

export async function staffLogin(email: string, password: string): Promise<StaffUser> {
  const res = await fetch(`${API_URL}/auth/staff-login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  });

  if (res.status === 401 || res.status === 400) {
    throw new Error('Неверный email или пароль, либо у аккаунта нет доступа к панели.');
  }
  if (res.status === 429) {
    throw new Error('Слишком много попыток входа. Подождите минуту.');
  }
  if (!res.ok) {
    throw new Error('Сервер недоступен. Попробуйте ещё раз.');
  }

  const data = (await res.json()) as { user: StaffUser; accessToken: string };
  localStorage.setItem(TOKEN_KEY, data.accessToken);
  return data.user;
}

/** Запрос к API с токеном сотрудника. 401/403 — сессия недействительна, нужен повторный вход. */
export async function staffFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = readToken();
  if (!token) throw new StaffAuthError();

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers },
  });

  if (res.status === 401 || res.status === 403) {
    clearStaffToken();
    throw new StaffAuthError();
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

/** Текущий сотрудник по сохранённому токену или null, если нужно войти. */
export async function getStaffUser(): Promise<StaffUser | null> {
  try {
    const user = await staffFetch<StaffUser & { scope?: string }>('/auth/me');
    if (user.scope !== 'staff' || !(user.role in STAFF_ROLE_LABEL)) {
      clearStaffToken();
      return null;
    }
    return user;
  } catch (err) {
    if (err instanceof StaffAuthError) return null;
    throw err;
  }
}
