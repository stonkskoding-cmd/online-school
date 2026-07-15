import { useCallback, useEffect, useRef, useState } from 'react';
import { adminApiClient, type AdminChatSummary } from '../api';
import { getAdminBearerToken } from '../utils/adminAuth';
import type { ChatMessageItem } from './useChat';

const POLL_MS = 4000;

function normalizeMessage(raw: Record<string, unknown>): ChatMessageItem {
  return {
    id: String(raw.id ?? `${Date.now()}`),
    text: String(raw.content ?? raw.text ?? ''),
    isFromAdmin: Boolean(raw.isAdmin ?? raw.isFromAdmin),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

export interface AdminChatThread {
  userId: string;
  email: string;
  name?: string;
  lastMessage?: { content: string; createdAt: string; isAdmin: boolean } | null;
  unreadCount: number;
}

export function useAdminChat(selectedUserId: string | null) {
  const [threads, setThreads] = useState<AdminChatThread[]>([]);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const selectedRef = useRef(selectedUserId);

  useEffect(() => {
    selectedRef.current = selectedUserId;
  }, [selectedUserId]);

  const token = getAdminBearerToken();

  const loadThreads = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await adminApiClient.adminChats();
      const list = (data.chats ?? []).map((c: AdminChatSummary) => ({
        userId: c.userId,
        email: c.email,
        name: c.name,
        lastMessage: c.lastMessage,
        unreadCount: c.unreadCount ?? 0,
      }));
      setThreads(list);
      setTotalUnread(data.totalUnread ?? 0);
    } catch (err) {
      console.error('[admin-chat] load threads failed', err);
      setError('Не удалось загрузить диалоги');
    }
  }, [token]);

  const loadHistory = useCallback(
    async (userId: string, silent = false) => {
      if (!token) return;
      if (!silent) setLoadingMessages(true);
      try {
        const { data } = await adminApiClient.adminChatThread(userId);
        const list = (data.messages ?? []).map((m) =>
          normalizeMessage(m as unknown as Record<string, unknown>),
        );
        if (selectedRef.current === userId) setMessages(list);
      } catch (err) {
        console.error('[admin-chat] load history failed', err);
        if (!silent) setError('Не удалось загрузить сообщения');
      } finally {
        if (!silent) setLoadingMessages(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (!token) return undefined;
    setLoadingThreads(true);
    void loadThreads().finally(() => setLoadingThreads(false));

    const interval = setInterval(() => {
      // Не опрашиваем сервер, пока вкладка скрыта — экономим запросы и нагрузку.
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      void loadThreads();
      if (selectedRef.current) {
        void loadHistory(selectedRef.current, true);
      }
    }, POLL_MS);

    return () => clearInterval(interval);
  }, [token, loadThreads, loadHistory]);

  useEffect(() => {
    if (selectedUserId) {
      setError(null);
      void loadHistory(selectedUserId);
    } else {
      setMessages([]);
    }
  }, [selectedUserId, loadHistory]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !selectedUserId || !token) return;

      setSending(true);
      setError(null);
      try {
        const { data } = await adminApiClient.postAdminChatMessage({
          userId: selectedUserId,
          content: trimmed,
        });
        // Оптимистично показываем ответ админа сразу.
        const created = data?.message as unknown as Record<string, unknown> | undefined;
        if (created && selectedRef.current === selectedUserId) {
          const item = normalizeMessage(created);
          setMessages((prev) => (prev.some((m) => m.id === item.id) ? prev : [...prev, item]));
        }
        // Фоновая сверка параллельно — не блокирует UI.
        void Promise.all([loadHistory(selectedUserId, true), loadThreads()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось отправить');
      } finally {
        setSending(false);
      }
    },
    [selectedUserId, token, loadHistory, loadThreads],
  );

  const clearHistory = useCallback(async () => {
    if (!selectedUserId || !token) return;
    if (!window.confirm('Очистить все сообщения в этом чате? Чат останется открытым.')) return;
    try {
      await adminApiClient.clearAdminChat(selectedUserId);
      setMessages([]);
      await loadThreads();
    } catch (err) {
      setError('Не удалось очистить переписку');
      console.error(err);
    }
  }, [selectedUserId, token, loadThreads]);

  const deleteChat = useCallback(async () => {
    if (!selectedUserId || !token) return;
    if (!window.confirm('Удалить чат полностью? Переписка будет удалена, чат закроется.')) return;
    try {
      await adminApiClient.deleteAdminChat(selectedUserId);
      setMessages([]);
      await loadThreads();
      return true;
    } catch (err) {
      setError('Не удалось удалить чат');
      console.error(err);
      return false;
    }
  }, [selectedUserId, token, loadThreads]);

  return {
    threads,
    messages,
    loadingThreads,
    loadingMessages,
    sending,
    error,
    totalUnread,
    isConnected: true,
    isReconnecting: false,
    sendMessage,
    loadThreads,
    clearHistory,
    deleteChat,
  };
}
