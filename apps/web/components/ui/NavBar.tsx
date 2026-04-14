'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';

const NAV_LINKS = [
  { href: '/catalog',         label: 'Каталог' },
  { href: '/map',             label: 'Карта' },
  { href: '/chat',            label: 'AI-консультант' },
  { href: '/recommendations', label: 'Подборка' },
  { href: '/calculator',      label: 'Калькулятор' },
  { href: '/favorites',       label: '❤' },
];

export function NavBar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuthStore();

  return (
    <nav
      style={{
        background:   '#fff',
        borderBottom: '1px solid rgba(15,25,35,0.08)',
        position:     'sticky',
        top:          0,
        zIndex:       200,
        padding:      '0 1.5rem',
      }}
    >
      <div
        style={{
          maxWidth:   1400,
          margin:     '0 auto',
          height:     64,
          display:    'flex',
          alignItems: 'center',
          gap:        '1.5rem',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            fontFamily:     'Unbounded, sans-serif',
            fontSize:       '0.9rem',
            fontWeight:     700,
            color:          '#0F1923',
            textDecoration: 'none',
            display:        'flex',
            alignItems:     'center',
            gap:            6,
            whiteSpace:     'nowrap',
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2F80ED', flexShrink: 0 }} />
          Новостройки Уфы
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 4, flex: 1, overflowX: 'auto' }}>
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                style={{
                  padding:        '0.4rem 0.875rem',
                  borderRadius:   8,
                  fontSize:       '0.875rem',
                  fontWeight:     500,
                  color:          active ? '#2F80ED' : 'rgba(15,25,35,0.6)',
                  background:     active ? '#EBF4FF' : 'transparent',
                  textDecoration: 'none',
                  whiteSpace:     'nowrap',
                  transition:     'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color      = '#0F1923';
                    e.currentTarget.style.background = '#F7F9FC';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color      = 'rgba(15,25,35,0.6)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Auth actions */}
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', marginLeft: 'auto' }}>
          {user ? (
            <>
              <span style={{ fontSize: '0.875rem', color: 'rgba(15,25,35,0.55)' }}>
                {user.name ?? user.email}
              </span>
              <button
                onClick={() => { logout(); router.push('/'); }}
                style={{
                  padding:    '0.4rem 0.875rem',
                  borderRadius: 8,
                  border:     '1.5px solid rgba(15,25,35,0.15)',
                  background: 'none',
                  fontSize:   '0.875rem',
                  fontWeight: 500,
                  cursor:     'pointer',
                  color:      'rgba(15,25,35,0.6)',
                }}
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                style={{
                  padding:        '0.4rem 0.875rem',
                  borderRadius:   8,
                  border:         '1.5px solid rgba(15,25,35,0.15)',
                  fontSize:       '0.875rem',
                  fontWeight:     500,
                  color:          '#0F1923',
                  textDecoration: 'none',
                }}
              >
                Войти
              </Link>
              <Link
                href="/auth/register"
                style={{
                  padding:        '0.4rem 0.875rem',
                  borderRadius:   8,
                  background:     '#2F80ED',
                  color:          '#fff',
                  fontSize:       '0.875rem',
                  fontWeight:     600,
                  textDecoration: 'none',
                  boxShadow:      '0 2px 10px rgba(47,128,237,0.3)',
                }}
              >
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
