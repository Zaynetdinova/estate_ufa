'use client';

import type { ChatMessage } from '@/lib/api';

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div
      style={{
        display:       'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom:  '0.75rem',
      }}
    >
      {!isUser && (
        <div
          style={{
            width:           32,
            height:          32,
            borderRadius:    '50%',
            background:      '#2F80ED',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            color:           '#fff',
            fontSize:        '0.75rem',
            fontWeight:      700,
            flexShrink:      0,
            marginRight:     '0.625rem',
            alignSelf:       'flex-end',
          }}
        >
          AI
        </div>
      )}

      <div
        style={{
          maxWidth:      '72%',
          padding:       '0.75rem 1rem',
          borderRadius:  isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background:    isUser ? '#2F80ED' : '#fff',
          color:         isUser ? '#fff' : '#0F1923',
          fontSize:      '0.9375rem',
          lineHeight:    1.55,
          boxShadow:     '0 1px 4px rgba(0,0,0,0.06)',
          whiteSpace:    'pre-wrap',
          wordBreak:     'break-word',
        }}
      >
        {message.content || (
          // анимация печати
          <span style={{ display: 'flex', gap: 4, alignItems: 'center', height: 20 }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width:            6,
                  height:           6,
                  borderRadius:     '50%',
                  background:       '#0F1923',
                  opacity:          0.3,
                  animation:        `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
            <style>{`
              @keyframes bounce {
                0%,80%,100%{transform:translateY(0)}
                40%{transform:translateY(-6px);opacity:0.9}
              }
            `}</style>
          </span>
        )}
      </div>
    </div>
  );
}
