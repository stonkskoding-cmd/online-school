import { useCallback, useEffect, useRef, useState } from 'react';
import { chatApi, type ApiChatMessage } from '../api';

export interface ChatMessageItem {
  id: string;
  text: string;
  isFromAdmin: boolean;
  createdAt: string;
}

const POLL_MS = 4000;

function normalizeMessage(raw: Record<string, unknown>): ChatMessageItem {
  return {
    id: String(raw.id ?? `${Date.now()}`),
    text: String(raw.content ?? raw.text ?? ''),
    isFromAdmin: Boolean(raw.isAdmin ?? raw.isFromAdmin),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

function mergeMessages(prev: ChatMessageItem[], incoming: ChatMessageItem[]) {
  const map = new Map(prev.map((m) => [m.id, m]));
  for (const m of incoming) map.set(m.id, m);
  return [...map.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

/** Клиентский чат: polling каждые 4с (стабильно на Render) + REST отправка */
export function useChat(isOpen: boolean) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const isOpenRef = useRef(isOpen);
  const lastCountRef = useRef(0);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token')?.trim() : null;
  const isAuthenticated = Boolean(token);

  const loadMessages = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await chatApi.getMessages();
      const list = (data.messages ?? []).map((m: ApiChatMessage) =>
        normalizeMessage(m as unknown as Record<string, unknown>),
      );
      setMessages(list);

      if (!isOpenRef.current) {
        const adminUnread = list.filter((m) => m.isFromAdmin).length;
        const delta = adminUnread - lastCountRef.current;
        if (delta > 0) setUnreadCount((c) => c + delta);
        lastCountRef.current = adminUnread;
      }
    } catch (err: unknown) {
      console.error('[chat-ui] poll failed', err);
      if (isOpenRef.current) {
        const axiosErr = err as { code?: string; message?: string };
        if (axiosErr.code === 'ERR_NETWORK') {
          setError('Сервер недоступен. Повтор через несколько секунд…');
        }
      }
    }
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;

    if (isOpen) {
      setLoading(true);
      setError(null);
      setUnreadCount(0);
      void loadMessages().finally(() => setLoading(false));
    }

    const interval = setInterval(() => {
      void loadMessages();
    }, POLL_MS);

    return () => clearInterval(interval);
  }, [token, isOpen, loadMessages]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !token) return;

      setSending(true);
      setError(null);
      try {
        const { data } = await chatApi.sendMessage(trimmed);
        const item = normalizeMessage((data.message ?? {}) as unknown as Record<string, unknown>);
        setMessages((prev) => mergeMessages(prev, [item]));
      } catch (err: unknown) {
        console.error('[chat-ui] send failed', err);
        setError('Не удалось отправить сообщение');
      } finally {
        setSending(false);
      }
    },
    [token],
  );

  return {
    messages,
    loading,
    sending,
    error,
    unreadCount,
    isConnected: true,
    isReconnecting: false,
    isAuthenticated,
    sendMessage,
    loadMessages,
  };
}
