import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { adminApiClient, type AdminChatSummary } from '../api';
import { getAdminBearerToken } from '../utils/adminAuth';
import type { ChatMessageItem } from './useChat';

function normalizeMessage(raw: Record<string, unknown>): ChatMessageItem {
  return {
    id: String(raw.id ?? `${Date.now()}`),
    text: String(raw.content ?? raw.text ?? ''),
    isFromAdmin: Boolean(raw.isAdmin ?? raw.isFromAdmin),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

const SOCKET_BASE =
  import.meta.env.VITE_SOCKET_URL || 'https://online-school-backend-mqn9.onrender.com';

const SOCKET_EMIT_TIMEOUT_MS = 8000;

function emitWithAck<T>(
  socket: Socket,
  event: string,
  payload: unknown,
  timeoutMs = SOCKET_EMIT_TIMEOUT_MS,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('Socket timeout')), timeoutMs);
    socket.emit(event, payload, (response: T) => {
      window.clearTimeout(timer);
      resolve(response);
    });
  });
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
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const selectedUserIdRef = useRef(selectedUserId);

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  const token = getAdminBearerToken();

  const loadThreads = useCallback(async () => {
    if (!token) return;
    setLoadingThreads(true);
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
    } finally {
      setLoadingThreads(false);
    }
  }, [token]);

  const loadHistory = useCallback(
    async (userId: string) => {
      if (!token) return;
      setLoadingMessages(true);
      setError(null);
      try {
        const { data } = await adminApiClient.adminChatThread(userId);
        const list = (data.messages ?? []).map((m) =>
          normalizeMessage(m as unknown as Record<string, unknown>),
        );
        setMessages(list);
        socketRef.current?.emit('mark_read', { userId });
      } catch (err) {
        console.error('[admin-chat] load history failed', err);
        setError('Не удалось загрузить сообщения');
      } finally {
        setLoadingMessages(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (!token) return undefined;

    loadThreads();

    const socket = io(`${SOCKET_BASE}/support`, {
      path: '/socket.io',
      auth: { token },
      transports: ['polling', 'websocket'],
      withCredentials: false,
      reconnection: true,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    socketRef.current = socket;
    socket.emit('join_admin');

    socket.on('connect', () => {
      setIsConnected(true);
      setIsReconnecting(false);
      socket.emit('join_admin');
    });

    socket.io.on('reconnect_attempt', () => setIsReconnecting(true));

    socket.on('connect_error', (err) => {
      console.warn('[admin-chat] socket connect_error', err.message);
      setIsConnected(false);
    });

    socket.on('disconnect', () => setIsConnected(false));

    const onNew = (payload: { userId?: string; message?: Record<string, unknown> }) => {
      if (payload?.message && payload.userId) {
        if (payload.userId === selectedUserIdRef.current) {
          setMessages((prev) => {
            const item = normalizeMessage(payload.message!);
            if (prev.some((m) => m.id === item.id)) return prev;
            return [...prev, item];
          });
        }
        void loadThreads();
      }
    };

    socket.on('new_message', onNew);
    socket.on('newMessage', onNew);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, loadThreads]);

  useEffect(() => {
    if (selectedUserId) {
      loadHistory(selectedUserId);
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
      const socket = socketRef.current;

      try {
        if (socket?.connected) {
          try {
            const response = await emitWithAck<{
              success: boolean;
              message?: Record<string, unknown>;
              error?: string;
            }>(socket, 'admin:message', {
              userId: selectedUserId,
              content: trimmed,
              text: trimmed,
            });

            if (response?.success && response.message) {
              const item = normalizeMessage(response.message);
              setMessages((prev) =>
                prev.some((m) => m.id === item.id) ? prev : [...prev, item],
              );
            } else {
              throw new Error(response?.error || 'Ошибка отправки');
            }
          } catch (socketErr) {
            console.warn('[admin-chat] socket send failed, fallback to REST', socketErr);
            await adminApiClient.postAdminChatMessage({ userId: selectedUserId, content: trimmed });
            await loadHistory(selectedUserId);
          }
        } else {
          await adminApiClient.postAdminChatMessage({ userId: selectedUserId, content: trimmed });
          await loadHistory(selectedUserId);
        }
        await loadThreads();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось отправить');
      } finally {
        setSending(false);
      }
    },
    [selectedUserId, token, loadHistory, loadThreads],
  );

  return {
    threads,
    messages,
    loadingThreads,
    loadingMessages,
    sending,
    error,
    totalUnread,
    isConnected,
    isReconnecting,
    sendMessage,
    loadThreads,
  };
}
