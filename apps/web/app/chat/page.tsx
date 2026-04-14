import { ChatWindow } from '@/components/chat/ChatWindow';

export const metadata = { title: 'AI-консультант | Новостройки Уфы' };

export default function ChatPage() {
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '1.5rem 1rem', height: 'calc(100vh - 80px)' }}>
      <ChatWindow />
    </main>
  );
}
