'use client';

import { useEffect, useRef } from 'react';
import { useChat } from '@/lib/hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { RequestSelectionButton } from '../leads/RequestSelectionButton';

const QUICK_PROMPTS = [
  'Ищу 2-комнатную до 5 млн ₽',
  'Какие ЖК сдаются в 2025?',
  'Хочу квартиру в Советском районе',
  'Что лучше для инвестиций?',
];

export function ChatWindow() {
  const { messages, isLoading, error, sendMessage, clearError } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Автоскролл вниз при новых сообщениях
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isEmpty = messages.length === 0;

  return (
    <div
      style={{
        display:       'flex',
        flexDirection: 'column',
        height:        '100%',
        background:    '#F7F9FC',
        borderRadius:  16,
        overflow:      'hidden',
        border:        '1px solid rgba(15,25,35,0.08)',
        boxShadow:     '0 4px 20px rgba(0,0,0,0.08)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding:      '1rem 1.25rem',
          background:   '#fff',
          borderBottom: '1px solid rgba(15,25,35,0.08)',
          display:      'flex',
          alignItems:   'center',
          gap:          '0.75rem',
        }}
      >
        <div
          style={{
            width:          40,
            height:         40,
            borderRadius:   '50%',
            background:     'linear-gradient(135deg, #2F80ED, #1A6DD4)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            color:          '#fff',
            fontWeight:     700,
            fontSize:       '0.875rem',
            flexShrink:     0,
          }}
        >
          AI
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#0F1923' }}>
            AI-консультант
          </div>
          <div style={{ fontSize: '0.78rem', color: '#27AE60', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#27AE60', display: 'inline-block' }} />
            Онлайн
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div
        style={{
          flex:       1,
          overflowY:  'auto',
          padding:    '1rem',
          display:    'flex',
          flexDirection: 'column',
        }}
      >
        {isEmpty && (
          <div style={{ margin: 'auto', textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🏠</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0F1923', marginBottom: '0.5rem' }}>
              Привет! Я помогу найти вашу квартиру
            </div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(15,25,35,0.55)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Расскажите о своих пожеланиях — бюджет, район, количество комнат
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  style={{
                    padding:      '0.5rem 0.875rem',
                    borderRadius: 20,
                    border:       '1.5px solid rgba(47,128,237,0.3)',
                    background:   'rgba(47,128,237,0.06)',
                    color:        '#2F80ED',
                    fontSize:     '0.8125rem',
                    fontWeight:   500,
                    cursor:       'pointer',
                    fontFamily:   'Manrope, sans-serif',
                    transition:   'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(47,128,237,0.12)';
                    e.currentTarget.style.borderColor = '#2F80ED';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(47,128,237,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(47,128,237,0.3)';
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {/* Кнопка лидогенерации — показываем после 3+ сообщений */}
        {messages.length >= 3 && (
          <div style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}>
            <RequestSelectionButton source="chat" />
          </div>
        )}

        {error && (
          <div
            style={{
              padding:      '0.75rem 1rem',
              borderRadius: 10,
              background:   'rgba(235,87,87,0.1)',
              color:        '#EB5757',
              fontSize:     '0.875rem',
              display:      'flex',
              gap:          '0.5rem',
              alignItems:   'center',
            }}
          >
            <span style={{ flex: 1 }}>{error}</span>
            <button
              onClick={clearError}
              style={{ background: 'none', border: 'none', color: '#EB5757', cursor: 'pointer', fontWeight: 700 }}
            >
              ×
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
