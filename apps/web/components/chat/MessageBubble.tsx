'use client';

import type { ChatMessage } from '@/lib/api';

interface Props {
  message: ChatMessage;
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  return lines.map((line, li) => {
    const parts: React.ReactNode[] = [];
    const regex = /\*\*(.+?)\*\*/g;
    let last = 0, m: RegExpExecArray | null;
    while ((m = regex.exec(line)) !== null) {
      if (m.index > last) parts.push(line.slice(last, m.index));
      parts.push(<strong key={m.index}>{m[1]}</strong>);
      last = m.index + m[0].length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return (
      <span key={li}>
        {parts}
        {li < lines.length - 1 && <br />}
      </span>
    );
  });
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '0.75rem' }}>
      {!isUser && (
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #2F80ED, #7bb8f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
          🤖
        </div>
      )}

      <div
        style={{
          maxWidth:     '72%',
          padding:      '0.75rem 1rem',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background:   isUser ? '#2F80ED' : '#fff',
          color:        isUser ? '#fff' : '#0F1923',
          fontSize:     '0.9375rem',
          lineHeight:   1.6,
          boxShadow:    '0 1px 4px rgba(0,0,0,0.06)',
          wordBreak:    'break-word',
        }}
      >
        {message.content ? renderMarkdown(message.content) : (
          <span style={{ display: 'flex', gap: 4, alignItems: 'center', height: 20 }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#0F1923', opacity: 0.3, animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
            <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px);opacity:0.9}}`}</style>
          </span>
        )}
      </div>

      {isUser && (
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #9F67F5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', flexShrink: 0 }}>
          👤
        </div>
      )}
    </div>
  );
}
