'use client';

import { useState, useRef, type KeyboardEvent } from 'react';

interface Props {
  onSend:    (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  };

  return (
    <div
      style={{
        display:      'flex',
        gap:          '0.5rem',
        alignItems:   'flex-end',
        padding:      '0.75rem 1rem',
        background:   '#fff',
        borderTop:    '1px solid rgba(15,25,35,0.08)',
        borderRadius: '0 0 16px 16px',
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        disabled={disabled}
        rows={1}
        placeholder="Напиши, что ищешь… (Enter — отправить)"
        style={{
          flex:         1,
          resize:       'none',
          border:       '1.5px solid rgba(15,25,35,0.12)',
          borderRadius: 12,
          padding:      '0.625rem 0.875rem',
          fontFamily:   'Manrope, sans-serif',
          fontSize:     '0.9375rem',
          lineHeight:   1.5,
          outline:      'none',
          transition:   'border-color 0.2s',
          background:   '#F7F9FC',
          color:        '#0F1923',
          maxHeight:    140,
          overflowY:    'auto',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = '#2F80ED')}
        onBlur={(e)  => (e.currentTarget.style.borderColor = 'rgba(15,25,35,0.12)')}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        style={{
          width:        42,
          height:       42,
          borderRadius: 12,
          border:       'none',
          background:   disabled || !value.trim() ? '#E2E8F0' : '#2F80ED',
          color:        '#fff',
          cursor:       disabled || !value.trim() ? 'not-allowed' : 'pointer',
          flexShrink:   0,
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          transition:   'background 0.2s, transform 0.15s',
          transform:    'translateY(0)',
        }}
        onMouseEnter={(e) => {
          if (!disabled && value.trim())
            e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        aria-label="Отправить"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}
