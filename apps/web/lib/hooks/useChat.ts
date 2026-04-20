'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { streamChatMessage, chatApi, type ChatMessage } from '../api';
import { useAuthStore } from '../store/auth.store';
import { useTrackEvent } from './useTrackEvent';

export interface UseChatReturn {
  messages:   ChatMessage[];
  isLoading:  boolean;
  error:      string | null;
  sendMessage: (text: string) => Promise<void>;
  clearError:  () => void;
}

const STORAGE_KEY = (sessionId: string) => `chat:${sessionId}`;

export function useChat(): UseChatReturn {
  const [messages,  setMessages]  = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const abortRef  = useRef<AbortController | null>(null);
  const sessionId = useAuthStore((s) => s.sessionId);
  const user      = useAuthStore((s) => s.user);
  const track     = useTrackEvent();

  // Загрузить историю при монтировании и при смене пользователя
  useEffect(() => {
    if (user) {
      // Авторизован — берём всю историю из БД (без фильтра по sessionId)
      chatApi.history().then(setMessages).catch(() => {});
    } else {
      // Гость — берём из sessionStorage
      setMessages([]);
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY(sessionId));
        if (saved) setMessages(JSON.parse(saved));
      } catch {}
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Сохранять историю гостя в sessionStorage при каждом изменении
  useEffect(() => {
    if (!user && messages.length > 0) {
      try {
        sessionStorage.setItem(STORAGE_KEY(sessionId), JSON.stringify(messages));
      } catch {}
    }
  }, [messages, sessionId, user]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Добавляем сообщение пользователя
    const userMsg: ChatMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setIsLoading(true);
    setError(null);

    // Трекаем событие
    track('USER_MESSAGE', { message: text, sessionId });

    // Заглушка для ответа ассистента
    const assistantMsg: ChatMessage = { role: 'assistant', content: '' };
    setMessages([...nextMessages, assistantMsg]);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      await streamChatMessage(
        nextMessages,
        sessionId,
        (chunk) => {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last.role !== 'assistant') return prev;
            return [
              ...prev.slice(0, -1),
              { role: 'assistant', content: last.content + chunk },
            ];
          });
        },
        abortRef.current.signal,
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError('Ошибка соединения. Попробуй ещё раз.');
      // Убираем пустое сообщение ассистента
      setMessages((prev) =>
        prev[prev.length - 1]?.content === '' ? prev.slice(0, -1) : prev,
      );
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, sessionId, track]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearError: () => setError(null),
  };
}
