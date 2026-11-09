'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  clearStaffToken,
  getStaffUser,
  STAFF_ROLE_LABEL,
  type StaffUser,
} from '@/lib/staff-auth';

interface StaffSession {
  user: StaffUser;
  /** Выйти из панели. expired — сессия истекла, после входа вернуть на текущую страницу. */
  signOut: (expired?: boolean) => void;
}

const StaffSessionContext = createContext<StaffSession | null>(null);

export function useStaffSession(): StaffSession {
  const session = useContext(StaffSessionContext);
  if (!session) throw new Error('useStaffSession используется вне AdminShell');
  return session;
}

const LOGIN_PATH = '/admin/login';

const NAV_LINKS = [
  { href: '/admin/leads', label: 'Лиды' },
];

/**
 * Обёртка всех страниц /admin: проверяет токен сотрудника и показывает шапку панели.
 * Без входа перенаправляет на /admin/login, запомнив, куда вернуться.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const isLogin  = pathname === LOGIN_PATH;

  const [user,  setUser]  = useState<StaffUser | null>(null);
  const [error, setError] = useState(false);

  const goToLogin = useCallback(() => {
    const back = window.location.pathname + window.location.search;
    router.replace(`${LOGIN_PATH}?next=${encodeURIComponent(back)}`);
  }, [router]);

  useEffect(() => {
    if (isLogin) return;
    let cancelled = false;
    setError(false);
    getStaffUser()
      .then((u) => {
        if (cancelled) return;
        if (u) setUser(u);
        else goToLogin();
      })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [isLogin, goToLogin]);

  const signOut = useCallback((expired = false) => {
    clearStaffToken();
    setUser(null);
    if (expired) goToLogin();
    else router.replace(LOGIN_PATH);
  }, [goToLogin, router]);

  if (isLogin) return <>{children}</>;

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'rgba(15,25,35,0.6)' }}>
        Не удалось связаться с сервером. Обновите страницу.
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'rgba(15,25,35,0.45)' }}>
        Проверяем доступ…
      </div>
    );
  }

  return (
    <StaffSessionContext.Provider value={{ user, signOut }}>
      <header
        style={{
          background:   '#0F1923',
          color:        '#fff',
          position:     'sticky',
          top:          0,
          zIndex:       200,
          padding:      '0 1rem',
        }}
      >
        <div
          style={{
            maxWidth:   1400,
            margin:     '0 auto',
            minHeight:  56,
            display:    'flex',
            alignItems: 'center',
            flexWrap:   'wrap',
            gap:        '0.5rem 1.25rem',
            padding:    '0.5rem 0',
          }}
        >
          <span style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
            Панель управления
          </span>

          <nav style={{ display: 'flex', gap: '0.25rem' }}>
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    padding:        '6px 12px',
                    borderRadius:   8,
                    fontSize:       '0.875rem',
                    fontWeight:     600,
                    textDecoration: 'none',
                    color:          active ? '#fff' : 'rgba(255,255,255,0.6)',
                    background:     active ? 'rgba(255,255,255,0.12)' : 'transparent',
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', minWidth: 0 }}>
            <Link href="/catalog" style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
              На сайт ↗
            </Link>
            <span
              style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}
              title={user.email}
            >
              {user.email}
            </span>
            <span
              style={{
                padding:      '2px 8px',
                borderRadius: 6,
                fontSize:     '0.75rem',
                fontWeight:   700,
                background:   user.role === 'admin' ? '#F2994A' : '#2F80ED',
                color:        '#fff',
              }}
            >
              {STAFF_ROLE_LABEL[user.role]}
            </span>
            <button
              type="button"
              onClick={() => signOut()}
              style={{
                padding:      '6px 12px',
                borderRadius: 8,
                border:       '1px solid rgba(255,255,255,0.25)',
                background:   'transparent',
                color:        '#fff',
                fontFamily:   'Manrope, sans-serif',
                fontSize:     '0.8125rem',
                fontWeight:   600,
                cursor:       'pointer',
              }}
            >
              Выйти
            </button>
          </div>
        </div>
      </header>
      {children}
    </StaffSessionContext.Provider>
  );
}
