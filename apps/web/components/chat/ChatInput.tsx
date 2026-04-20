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
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
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
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  return (
    <>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        disabled={disabled}
        rows={1}
        placeholder="Спросите что-нибудь о новостройках Уфы..."
        style={{
          flex:       1,
          resize:     'none',
          border:     'none',
          outline:    'none',
          fontFamily: 'Manrope, sans-serif',
          fontSize:   '0.9rem',
          color:      '#0F1923',
          background: 'transparent',
          minHeight:  24,
          maxHeight:  120,
          overflowY:  'auto',
          lineHeight: 1.5,
        }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        style={{
          width:          40,
          height:         40,
          borderRadius:   10,
          border:         'none',
          background:     disabled || !value.trim() ? 'rgba(15,25,35,0.1)' : '#2F80ED',
          color:          '#fff',
          cursor:         disabled || !value.trim() ? 'not-allowed' : 'pointer',
          flexShrink:     0,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '1.1rem',
          transition:     'background 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!disabled && value.trim()) e.currentTarget.style.background = '#1A6DD4';
        }}
        onMouseLeave={(e) => {
          if (!disabled && value.trim()) e.currentTarget.style.background = '#2F80ED';
        }}
        aria-label="Отправить"
      >
        ➤
      </button>
    </>
  );
}
