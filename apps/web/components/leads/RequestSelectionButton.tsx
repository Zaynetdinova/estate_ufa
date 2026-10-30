'use client';

import { useState } from 'react';
import { leadsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth.store';
import { useTrackEvent } from '@/lib/hooks/useTrackEvent';

interface Props {
  source?: 'chat' | 'manual' | 'calculator';
  /** compact — небольшая кнопка для чата */
  variant?: 'primary' | 'banner' | 'compact';
  /** Контекст заявки для менеджера, например название ЖК или параметры расчёта */
  context?: string;
  /** Текст для поля «Что ищете?» в момент открытия формы, например последние сообщения из чата */
  getDefaultMessage?: () => string;
  /** Форма открыта или закрыта — чат прячет подпись, пока клиент заполняет форму */
  onFormToggle?: (open: boolean) => void;
}

type State = 'idle' | 'form' | 'loading' | 'success' | 'error';

export function RequestSelectionButton({ source = 'manual', variant = 'primary', context, getDefaultMessage, onFormToggle }: Props) {
  const user      = useAuthStore((s) => s.user);
  const sessionId = useAuthStore((s) => s.sessionId);
  const [state,   setState]   = useState<State>('idle');
  const [name,    setName]    = useState('');
  const [phone,   setPhone]   = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [error,   setError]   = useState('');
  const track = useTrackEvent();
  const compact = variant === 'compact';

  const openForm = () => {
    if (state !== 'idle') return;
    setName(user?.name ?? '');
    setPhone(user?.phone ?? '');
    if (!message && getDefaultMessage) setMessage(getDefaultMessage().slice(0, 2000));
    setState('form');
    onFormToggle?.(true);
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
        sessionId,
        consent:      true,
      });
      setState('success');
      onFormToggle?.(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить заявку');
      setState('error');
    }
  };

  const body = state === 'idle'
    ? <ButtonContent state="idle" onClick={openForm} compact={compact} />
    : state === 'success'
    ? <SuccessMessage dark={variant === 'banner'} />
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
        <label
          style={{
            display:    'flex',
            gap:        '0.5rem',
            alignItems: 'flex-start',
            textAlign:  'left',
            fontSize:   '0.75rem',
            lineHeight: 1.45,
            color:      variant === 'banner' ? 'rgba(255,255,255,0.7)' : 'rgba(15,25,35,0.6)',
            cursor:     'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            required
            style={{ marginTop: 2, flexShrink: 0 }}
          />
          <span>
            Согласен на обработку персональных данных. Менеджер увидит мою заявку и переписку с AI-консультантом на сайте
          </span>
        </label>
        {state === 'error' && (
          <div style={{ color: '#EB5757', fontSize: '0.8125rem' }}>{error}</div>
        )}
        <ButtonContent state={state === 'loading' ? 'loading' : 'submit'} type="submit" compact={compact} />
        {state !== 'loading' && (
          <button
            type="button"
            onClick={() => { setState('idle'); onFormToggle?.(false); }}
            style={{
              background: 'none',
              border:     'none',
              color:      variant === 'banner' ? 'rgba(255,255,255,0.6)' : 'rgba(15,25,35,0.5)',
              fontFamily: 'Manrope, sans-serif',
              fontSize:   '0.8125rem',
              cursor:     'pointer',
            }}
          >
            Отмена
          </button>
        )}
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

function SuccessMessage({ dark }: { dark: boolean }) {
  return (
    <div
      role="status"
      style={{
        display:      'flex',
        gap:          '0.625rem',
        alignItems:   'flex-start',
        textAlign:    'left',
        maxWidth:     360,
        margin:       '0 auto',
        padding:      '0.875rem 1rem',
        borderRadius: 12,
        background:   dark ? 'rgba(39,174,96,0.18)' : '#E8F8EE',
        color:        dark ? '#fff' : '#0F1923',
        fontSize:     '0.875rem',
        lineHeight:   1.5,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
        <path d="M20 6L9 17L4 12" stroke="#27AE60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span>Спасибо! Менеджер свяжется с вами в течение дня и подберёт варианты под ваш бюджет.</span>
    </div>
  );
}

type ButtonState = 'idle' | 'submit' | 'loading';

function ButtonContent({ state, onClick, type = 'button', compact = false }: {
  state: ButtonState;
  onClick?: () => void;
  type?: 'button' | 'submit';
  compact?: boolean;
}) {
  const config: Record<ButtonState, { label: string; bg: string; cursor: string }> = {
    idle:    { label: 'Подобрать с менеджером', bg: '#27AE60', cursor: 'pointer' },
    submit:  { label: 'Отправить заявку',       bg: '#27AE60', cursor: 'pointer' },
    loading: { label: 'Отправляем запрос…',     bg: '#6B7280', cursor: 'not-allowed' },
  };

  const { label, bg, cursor } = config[state];
  const active = state !== 'loading';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={state === 'loading'}
      style={{
        padding:      compact ? '0.55rem 1rem' : '0.75rem 1.5rem',
        borderRadius: 12,
        border:       'none',
        background:   bg,
        color:        '#fff',
        fontFamily:   'Manrope, sans-serif',
        fontWeight:   700,
        fontSize:     compact ? '0.875rem' : '0.9375rem',
        cursor,
        width:        '100%',
        maxWidth:     360,
        margin:       compact ? undefined : '0 auto',
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
