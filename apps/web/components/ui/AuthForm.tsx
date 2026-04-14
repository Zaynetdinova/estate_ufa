'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';

interface Props {
  mode: 'login' | 'register';
}

export function AuthForm({ mode }: Props) {
  const router   = useRouter();
  const { login, register } = useAuthStore();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name || undefined);
      }
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка. Попробуйте снова.');
    } finally {
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
    transition:   'border-color 0.2s',
  };

  return (
    <div
      style={{
        minHeight:      'calc(100vh - 64px)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '2rem 1rem',
      }}
    >
      <div
        style={{
          width:        '100%',
          maxWidth:     440,
          background:   '#fff',
          borderRadius: 20,
          border:       '1px solid rgba(15,25,35,0.08)',
          padding:      '2rem',
          boxShadow:    '0 4px 24px rgba(0,0,0,0.06)',
        }}
      >
        <h1
          style={{
            fontFamily:   'Unbounded, sans-serif',
            fontSize:     '1.25rem',
            fontWeight:   700,
            marginBottom: '0.375rem',
          }}
        >
          {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
        </h1>
        <p style={{ color: 'rgba(15,25,35,0.5)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
          {mode === 'login'
            ? 'Введите email и пароль'
            : 'Зарегистрируйтесь для персональных рекомендаций'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {mode === 'register' && (
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(15,25,35,0.65)', display: 'block', marginBottom: 6 }}>
                Имя (необязательно)
              </label>
              <input
                type="text"
                placeholder="Иван"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
                onFocus={(e)  => { e.currentTarget.style.borderColor = '#2F80ED'; }}
                onBlur={(e)   => { e.currentTarget.style.borderColor = 'rgba(15,25,35,0.15)'; }}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(15,25,35,0.65)', display: 'block', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              onFocus={(e)  => { e.currentTarget.style.borderColor = '#2F80ED'; }}
              onBlur={(e)   => { e.currentTarget.style.borderColor = 'rgba(15,25,35,0.15)'; }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(15,25,35,0.65)', display: 'block', marginBottom: 6 }}>
              Пароль
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Минимум 6 символов"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              onFocus={(e)  => { e.currentTarget.style.borderColor = '#2F80ED'; }}
              onBlur={(e)   => { e.currentTarget.style.borderColor = 'rgba(15,25,35,0.15)'; }}
            />
          </div>

          {error && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(235,87,87,0.1)', color: '#EB5757', fontSize: '0.875rem' }}>
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
              background:   loading ? '#94A3B8' : '#2F80ED',
              color:        '#fff',
              fontFamily:   'Manrope, sans-serif',
              fontWeight:   700,
              fontSize:     '0.9375rem',
              cursor:       loading ? 'not-allowed' : 'pointer',
              boxShadow:    loading ? 'none' : '0 2px 12px rgba(47,128,237,0.35)',
              transition:   'all 0.2s',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              gap:          8,
            }}
          >
            {loading && (
              <span
                style={{
                  width: 16, height: 16,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid #fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            )}
            {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'rgba(15,25,35,0.5)' }}>
          {mode === 'login' ? (
            <>Нет аккаунта? <Link href="/auth/register" style={{ color: '#2F80ED', fontWeight: 600 }}>Зарегистрироваться</Link></>
          ) : (
            <>Уже есть аккаунт? <Link href="/auth/login" style={{ color: '#2F80ED', fontWeight: 600 }}>Войти</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
