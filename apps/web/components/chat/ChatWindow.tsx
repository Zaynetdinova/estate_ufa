'use client';

import { useEffect, useRef } from 'react';
import { useChat } from '@/lib/hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';

const SUGGESTIONS = [
  { icon: '💰', label: 'Лучший для инвестиций', text: 'Какой ЖК самый выгодный для инвестиций?' },
  { icon: '🏠', label: 'Для аренды',            text: 'Где купить квартиру для сдачи в аренду?' },
  { icon: '💸', label: 'Дешёвые варианты',       text: 'Покажи самые дешёвые новостройки' },
  { icon: '📍', label: 'Лучший район',           text: 'Какой район Уфы лучше для жизни?' },
];

export function ChatWindow() {
  const { messages, isLoading, error, sendMessage, clearError } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Header ── */}
      <div
        style={{
          background:   '#fff',
          borderRadius: 20,
          border:       '1px solid rgba(15,25,35,0.08)',
          padding:      '1.25rem 1.75rem',
          display:      'flex',
          alignItems:   'center',
          gap:          '1rem',
          marginBottom: '1rem',
          flexShrink:   0,
        }}
      >
        <div
          style={{
            width:          44,
            height:         44,
            borderRadius:   '50%',
            background:     'linear-gradient(135deg, #2F80ED, #7bb8f7)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       '1.3rem',
            flexShrink:     0,
          }}
        >
          🤖
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.15rem' }}>
            AI-консультант по недвижимости
          </div>
          <div style={{ fontSize: '0.78rem', color: '#27AE60', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 6, height: 6, background: '#27AE60', borderRadius: '50%', display: 'inline-block', flexShrink: 0 }} />
            Онлайн · знает все ЖК Уфы
          </div>
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        style={{
          flex:          1,
          overflowY:     'auto',
          display:       'flex',
          flexDirection: 'column',
          gap:           '1rem',
          padding:       '0.5rem 0.25rem 0.5rem 0',
          minHeight:     0,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              background:   '#fff',
              borderRadius: 20,
              border:       '1px solid rgba(15,25,35,0.08)',
              padding:      '1.5rem',
              alignSelf:    'flex-start',
              maxWidth:     '80%',
            }}
          >
            <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: '#0F1923', margin: 0 }}>
              Привет! 👋 Я знаю все актуальные новостройки Уфы. Помогу выбрать квартиру для жизни или инвестиций. Что вас интересует?
            </p>
            <div style={{ fontSize: '0.7rem', color: 'rgba(15,25,35,0.3)', marginTop: '0.3rem' }}>
              {new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem', borderRadius: 10,
              background: 'rgba(235,87,87,0.1)', color: '#EB5757',
              fontSize: '0.875rem', display: 'flex', gap: '0.5rem', alignItems: 'center',
            }}
          >
            <span style={{ flex: 1 }}>{error}</span>
            <button onClick={clearError} style={{ background: 'none', border: 'none', color: '#EB5757', cursor: 'pointer', fontWeight: 700 }}>×</button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Suggestion chips ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem', flexShrink: 0 }}>
        {SUGGESTIONS.map(({ icon, label, text }) => (
          <button
            key={label}
            onClick={() => sendMessage(text)}
            disabled={isLoading}
            style={{
              padding:      '0.4rem 0.85rem',
              borderRadius: 32,
              border:       '1.5px solid rgba(15,25,35,0.08)',
              fontSize:     '0.8rem',
              fontWeight:   500,
              color:        'rgba(15,25,35,0.6)',
              background:   '#fff',
              cursor:       isLoading ? 'default' : 'pointer',
              transition:   'all 0.2s',
              fontFamily:   'Manrope, sans-serif',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.borderColor = '#2F80ED';
                e.currentTarget.style.color       = '#2F80ED';
                e.currentTarget.style.background  = '#EBF4FF';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(15,25,35,0.08)';
              e.currentTarget.style.color       = 'rgba(15,25,35,0.6)';
              e.currentTarget.style.background  = '#fff';
            }}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── Input ── */}
      <div
        style={{
          display:      'flex',
          gap:          '0.75rem',
          background:   '#fff',
          border:       '1px solid rgba(15,25,35,0.08)',
          borderRadius: 20,
          padding:      '0.75rem',
          flexShrink:   0,
        }}
      >
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
