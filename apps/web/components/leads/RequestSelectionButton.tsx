'use client';

import { useState } from 'react';
import { leadsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth.store';
import { useTrackEvent } from '@/lib/hooks/useTrackEvent';

interface Props {
  source?: 'chat' | 'manual' | 'calculator';
  variant?: 'primary' | 'banner';
  /** Контекст заявки для менеджера, например название ЖК */
  context?: string;
}

type State = 'idle' | 'form' | 'loading' | 'success' | 'error';

export function RequestSelectionButton({ source = 'manual', variant = 'primary', context }: Props) {
  const user = useAuthStore((s) => s.user);
  const [state,   setState]   = useState<State>('idle');
  const [name,    setName]    = useState('');
  const [phone,   setPhone]   = useState('');
  const [message, setMessage] = useState('');
  const [error,   setError]   = useState('');
  const track = useTrackEvent();

  const openForm = () => {
    if (state !== 'idle') return;
    setName(user?.name ?? '');
    setPhone(user?.phone ?? '');
    setState('form');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === 'loading') return;
    setState('loading');
    setError('');

    // Трекаем событие REQUEST_SELECTION (+10 к скору)
    track('REQUEST_SELECTION', { source, trigger: 'button_click' });

    try {
      await leadsApi.create({
        source,
        contactName:  name.trim() || undefined,
        contactPhone: phone.trim() || undefined,
        message:      message.trim() || undefined,
        notes:        context,
      });
      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить заявку');
      setState('error');
    }
  };

  const body = state === 'idle' || state === 'success'
    ? <ButtonContent state={state} onClick={openForm} />
    : (
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: 360, margin: '0 auto' }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Как к вам обращаться"
          maxLength={100}
          autoComplete="name"
          style={inputStyle}
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Телефон*"
          type="tel"
          required={!user}
          pattern="\+?[\d\s()\-]{6,20}"
          title="Например, +7 900 123-45-67"
          autoComplete="tel"
          style={inputStyle}
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Что ищете? Например: двушка до 7 млн, въезд в этом году"
          maxLength={2000}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
        {state === 'error' && (
          <div style={{ color: '#EB5757', fontSize: '0.8125rem' }}>{error}</div>
        )}
        <ButtonContent state={state === 'loading' ? 'loading' : 'submit'} type="submit" />
      </form>
    );

  if (variant === 'banner') {
    return (
      <div
        style={{
          background:   'linear-gradient(135deg, #0F1923 0%, #1a2a3a 100%)',
          borderRadius: 16,
          padding:      '1.5rem',
          textAlign:    'center',
          margin:       '1rem 0',
        }}
      >
        <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>
          Готовы к выбору квартиры?
        </div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
          Наш специалист подберёт лучшие варианты под ваш бюджет и пожелания
        </div>
        {body}
      </div>
    );
  }

  return body;
}

const inputStyle: React.CSSProperties = {
  padding:      '0.65rem 0.875rem',
  borderRadius: 10,
  border:       '1.5px solid rgba(15,25,35,0.12)',
  fontFamily:   'Manrope, sans-serif',
  fontSize:     '0.875rem',
  width:        '100%',
  boxSizing:    'border-box',
};

type ButtonState = 'idle' | 'submit' | 'loading' | 'success';

function ButtonContent({ state, onClick, type = 'button' }: {
  state: ButtonState;
  onClick?: () => void;
  type?: 'button' | 'submit';
}) {
  const config: Record<ButtonState, { label: string; bg: string; cursor: string }> = {
    idle:    { label: 'Получить подборку',   bg: '#27AE60', cursor: 'pointer' },
    submit:  { label: 'Отправить заявку',    bg: '#27AE60', cursor: 'pointer' },
    loading: { label: 'Отправляем запрос…',  bg: '#6B7280', cursor: 'not-allowed' },
    success: { label: 'Заявка принята!',     bg: '#27AE60', cursor: 'default' },
  };

  const { label, bg, cursor } = config[state];
  const active = state === 'idle' || state === 'submit';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={state === 'loading'}
      style={{
        padding:      '0.75rem 1.5rem',
        borderRadius: 12,
        border:       'none',
        background:   bg,
        color:        '#fff',
        fontFamily:   'Manrope, sans-serif',
        fontWeight:   700,
        fontSize:     '0.9375rem',
        cursor,
        width:        '100%',
        maxWidth:     360,
        transition:   'all 0.2s',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        gap:          '0.5rem',
        boxShadow:    active ? '0 2px 12px rgba(39,174,96,0.35)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (active) e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {state === 'success' && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17L4 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {state === 'loading' && (
        <span
          style={{
            width:        16,
            height:       16,
            border:       '2px solid rgba(255,255,255,0.3)',
            borderTop:    '2px solid #fff',
            borderRadius: '50%',
            animation:    'spin 0.8s linear infinite',
          }}
        />
      )}
      {label}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </button>
  );
}
