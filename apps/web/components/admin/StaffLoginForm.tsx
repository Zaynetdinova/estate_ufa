'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { staffLogin } from '@/lib/staff-auth';

const DEFAULT_PAGE = '/admin/leads';

/** Куда вернуться после входа: только страницы панели, чтобы ?next= нельзя было увести на чужой сайт */
function nextPage(): string {
  const next = new URLSearchParams(window.location.search).get('next');
  return next && next.startsWith('/admin/') && !next.startsWith('/admin/login') ? next : DEFAULT_PAGE;
}

export function StaffLoginForm() {
  const router = useRouter();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await staffLogin(email, password);
      router.replace(nextPage());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка. Попробуйте снова.');
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width:        '100%',
    padding:      '0.75rem 1rem',
    borderRadius: 10,
    border:       '1.5px solid rgba(15,25,35,0.15)',
    fontFamily:   'Manrope, sans-serif',
    fontSize:     '0.9375rem',
    outline:      'none',
    background:   '#F7F9FC',
    color:        '#0F1923',
    boxSizing:    'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize:     '0.8125rem',
    fontWeight:   500,
    color:        'rgba(15,25,35,0.65)',
    display:      'block',
    marginBottom: 6,
  };

  return (
    <div
      style={{
        minHeight:      '100vh',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '2rem 1rem',
        background:     '#0F1923',
        boxSizing:      'border-box',
      }}
    >
      <div
        style={{
          width:        '100%',
          maxWidth:     400,
          background:   '#fff',
          borderRadius: 20,
          padding:      '2rem',
          boxSizing:    'border-box',
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#2F80ED', marginBottom: 8 }}>
          Для сотрудников
        </div>
        <h1 style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.375rem' }}>
          Панель управления
        </h1>
        <p style={{ color: 'rgba(15,25,35,0.5)', fontSize: '0.875rem', margin: '0 0 1.75rem' }}>
          Вход для менеджеров и администраторов
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label htmlFor="staff-email" style={labelStyle}>Рабочий email</label>
            <input
              id="staff-email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="staff-password" style={labelStyle}>Пароль</label>
            <input
              id="staff-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          {error && (
            <div role="alert" style={{ padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(235,87,87,0.1)', color: '#C0392B', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding:      '0.875rem',
              borderRadius: 12,
              border:       'none',
              background:   loading ? '#94A3B8' : '#0F1923',
              color:        '#fff',
              fontFamily:   'Manrope, sans-serif',
              fontWeight:   700,
              fontSize:     '0.9375rem',
              cursor:       loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Входим…' : 'Войти в панель'}
          </button>
        </form>

        <p style={{ textAlign: 'center', margin: '1.25rem 0 0', fontSize: '0.8125rem', color: 'rgba(15,25,35,0.5)' }}>
          Вы покупатель? <Link href="/auth/login" style={{ color: '#2F80ED', fontWeight: 600 }}>Вход на сайт</Link>
        </p>
      </div>
    </div>
  );
}
