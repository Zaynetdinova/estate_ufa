import { ChatWindow } from '@/components/chat/ChatWindow';

export const metadata = { title: 'AI-консультант | Новостройки Уфы' };

export default function ChatPage() {
  return (
    <main
      style={{
        maxWidth:      900,
        margin:        '0 auto',
        padding:       '2rem',
        display:       'flex',
        flexDirection: 'column',
        height:        'calc(100vh - 64px)',
      }}
    >
      <ChatWindow />
    </main>
  );
}
