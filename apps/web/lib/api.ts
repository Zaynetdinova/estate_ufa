// ============================================================
// Центральный API-клиент
// Все запросы к NestJS бэкенду идут через этот файл.
// ============================================================

// На сервере (SSR/Docker) используем внутренний URL, в браузере — публичный
const BASE_URL = typeof window === 'undefined'
  ? (process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000')
  : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000');

// ── Типы ────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  intent: 'low' | 'medium' | 'high' | null;
  userPreferences: Record<string, unknown> | null;
}

export interface Property {
  id: number;
  slug: string;
  name: string;
  district: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  deadlineQ: number | null;
  deadlineYear: number | null;
  status: 'building' | 'ready';
  priceFrom: number;
  priceTo: number | null;
  priceM2: number | null;
  floors: number | null;
  areaMin: number | null;
  areaMax: number | null;
  description: string | null;
  isHot: boolean;
  viewsCount: number;
  developer: { id: number; name: string; logoUrl: string | null } | null;
  images: { id: number; url: string; alt: string | null; type: string }[];
  layouts: Layout[];
}

export interface Layout {
  id: number;
  rooms: number | null;
  areaMin: number | null;
  areaMax: number | null;
  priceFrom: number | null;
  priceTo: number | null;
  imageUrl: string | null;
}

export interface Lead {
  id: number;
  source: string;
  status: string;
  score: number;
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RecommendedProperty {
  id: number;
  name: string;
  slug: string;
  district: string;
  priceFrom: number;
  priceM2: number | null;
  status: string;
  reason: string;
}

export interface RecommendationResult {
  properties: RecommendedProperty[];
  summary: string;
  source: 'ai' | 'fallback';
}

export type EventType =
  | 'USER_MESSAGE'
  | 'VIEW_PROPERTY'
  | 'CALCULATOR_USED'
  | 'REQUEST_SELECTION'
  | 'ADD_FAVORITE'
  | 'AUTH_LOGIN';

// ── Базовый fetch с авторизацией ────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('accessToken')
    : null;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? 'API error');
  }

  return res.json() as Promise<T>;
}

// ── Auth ─────────────────────────────────────────────────────

export const authApi = {
  register: (data: { email: string; password: string; name?: string; phone?: string }) =>
    apiFetch<{ user: User; accessToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    apiFetch<{ user: User; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => apiFetch<User>('/auth/me'),
};

// ── Properties ───────────────────────────────────────────────

export const propertiesApi = {
  list: (params: Record<string, string | number | boolean | undefined> = {}) => {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    return apiFetch<{ items: Property[]; pagination: { total: number; page: number; pages: number } }>(
      `/properties${query ? `?${query}` : ''}`,
    );
  },

  bySlug: (slug: string) => apiFetch<Property>(`/properties/${slug}`),
};

// ── Events ───────────────────────────────────────────────────

export const eventsApi = {
  track: (data: {
    eventType: EventType;
    propertyId?: number;
    sessionId?: string;
    payload: Record<string, unknown>;
  }) =>
    apiFetch<void>('/events/track', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ── Leads ────────────────────────────────────────────────────

export const leadsApi = {
  create: (data: { source: 'chat' | 'manual' | 'calculator'; notes?: string }) =>
    apiFetch<Lead>('/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ── Recommendations ──────────────────────────────────────────

export const recommendationsApi = {
  get: (params?: { budgetMin?: number; budgetMax?: number }) => {
    const query = new URLSearchParams(
      Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    return apiFetch<RecommendationResult>(
      `/recommendations${query ? `?${query}` : ''}`,
    );
  },
};

// ── Chat ─────────────────────────────────────────────────────

export const chatApi = {
  history: (sessionId?: string) => {
    const query = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
    return apiFetch<ChatMessage[]>(`/chat/history${query}`);
  },
};

// ── Chat (streaming) ─────────────────────────────────────────

export async function streamChatMessage(
  messages: ChatMessage[],
  sessionId: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const token = localStorage.getItem('accessToken');

  const res = await fetch(`${BASE_URL}/chat/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages, sessionId }),
    signal,
  });

  if (!res.ok || !res.body) throw new Error('Chat stream failed');

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}

// ── Users ────────────────────────────────────────────────────

export const usersApi = {
  updateProfile: (data: {
    budgetMin?: number;
    budgetMax?: number;
    intent?: 'low' | 'medium' | 'high';
    userPreferences?: Record<string, unknown>;
  }) =>
    apiFetch<User>('/users/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  aiProfile: () => apiFetch<Partial<User>>('/users/me/ai-profile'),
};
