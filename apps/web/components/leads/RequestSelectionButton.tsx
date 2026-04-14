'use client';

import { useState } from 'react';
import { leadsApi } from '@/lib/api';
import { useTrackEvent } from '@/lib/hooks/useTrackEvent';

interface Props {
  source?: 'chat' | 'manual' | 'calculator';
  variant?: 'primary' | 'banner';
}

type State = 'idle' | 'loading' | 'success' | 'error';

export function RequestSelectionButton({ source = 'manual', variant = 'primary' }: Props) {
  const [state, setState] = useState<State>('idle');
  const track = useTrackEvent();

  const handleClick = async () => {
    if (state === 'loading' || state === 'success') return;
    setState('loading');

    // Трекаем событие REQUEST_SELECTION (+10 к скору)
    track('REQUEST_SELECTION', { source, trigger: 'button_click' });

    try {
      await leadsApi.create({ source });
      setState('success');
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  };

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
        <ButtonContent state={state} onClick={handleClick} />
      </div>
    );
  }

  return <ButtonContent state={state} onClick={handleClick} />;
}

function ButtonContent({ state, onClick }: { state: State; onClick: () => void }) {
  const config: Record<State, { label: string; bg: string; cursor: string }> = {
    idle:    { label: 'Получить подборку',   bg: '#27AE60', cursor: 'pointer' },
    loading: { label: 'Отправляем запрос…',  bg: '#6B7280', cursor: 'not-allowed' },
    success: { label: 'Заявка принята!',     bg: '#27AE60', cursor: 'default' },
    error:   { label: 'Ошибка. Повторить?',  bg: '#EB5757', cursor: 'pointer' },
  };

  const { label, bg, cursor } = config[state];

  return (
    <button
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
        boxShadow:    state === 'idle' ? '0 2px 12px rgba(39,174,96,0.35)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (state === 'idle') e.currentTarget.style.transform = 'translateY(-1px)';
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
