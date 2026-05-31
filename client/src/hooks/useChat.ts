import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { chatApi, type ApiChatMessage } from '../api';

export interface ChatMessageItem {
  id: string;
  text: string;
  isFromAdmin: boolean;
  createdAt: string;
}

function normalizeMessage(raw: Record<string, unknown>): ChatMessageItem {
  return {
    id: String(raw.id ?? raw._id ?? `${Date.now()}`),
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

export function useChat(isOpen: boolean) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token')?.trim() : null;
  const isAuthenticated = Boolean(token);

  const appendMessage = useCallback((raw: Record<string, unknown>) => {
    const item = normalizeMessage(raw);
    setMessages((prev) => {
      if (prev.some((m) => m.id === item.id)) return prev;
      return [...prev, item];
    });
    if (item.isFromAdmin && !isOpenRef.current) {
      setUnreadCount((c) => c + 1);
    }
  }, []);

  const loadMessages = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      console.log('[chat-ui] loadMessages');
      const { data } = await chatApi.getMessages();
      const list = (data.messages ?? []).map((m: ApiChatMessage) =>
        normalizeMessage(m as unknown as Record<string, unknown>),
      );
      setMessages(list);
    } catch (err: unknown) {
      console.error('[chat-ui] loadMessages failed', err);
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string; code?: string };
      const msg =
        axiosErr.response?.data?.message ||
        (axiosErr.code === 'ERR_NETWORK' || axiosErr.message === 'Network Error'
          ? 'Сервер недоступен. Подождите несколько секунд и попробуйте снова.'
          : null);
      setError(msg || 'Не удалось загрузить сообщения');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const markAsRead = useCallback(() => {
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('mark_read', {});
    }
  }, []);

  // Socket — держим подключение пока пользователь авторизован (badge + real-time)
  useEffect(() => {
    if (!token) return undefined;

    const socket = io(`${SOCKET_BASE}/support`, {
      path: '/socket.io',
      auth: { token },
      transports: ['polling', 'websocket'],
      withCredentials: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[chat-ui] socket connected');
      setIsConnected(true);
      setIsReconnecting(false);
    });

    socket.io.on('reconnect_attempt', () => {
      setIsReconnecting(true);
    });

    socket.on('connect_error', (err) => {
      console.warn('[chat-ui] socket connect_error', err.message);
      setIsConnected(false);
    });

    socket.on('disconnect', () => {
      console.log('[chat-ui] socket disconnected');
      setIsConnected(false);
    });

    const onNew = (payload: { message?: Record<string, unknown> }) => {
      if (payload?.message) appendMessage(payload.message);
    };

    socket.on('new_message', onNew);
    socket.on('message', (raw) => appendMessage(raw as Record<string, unknown>));
    socket.on('receive_message', (raw) => appendMessage(raw as Record<string, unknown>));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setIsReconnecting(false);
    };
  }, [token, appendMessage]);

  useEffect(() => {
    if (!isOpen || !token) return;
    loadMessages();
    setUnreadCount(0);
  }, [isOpen, token, loadMessages]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !token) return;

      setSending(true);
      setError(null);
      const socket = socketRef.current;

      try {
        // REST — надёжный fallback на Render (cold start / 503 на WebSocket)
        if (!socket?.connected) {
          const { data } = await chatApi.sendMessage(trimmed);
          appendMessage((data.message ?? {}) as unknown as Record<string, unknown>);
          return;
        }

        try {
          const response = await emitWithAck<{
            success: boolean;
            message?: Record<string, unknown>;
            error?: string;
          }>(socket, 'send_message', { content: trimmed, text: trimmed });

          if (response?.success && response.message) {
            appendMessage(response.message);
          } else {
            throw new Error(response?.error || 'Ошибка отправки');
          }
        } catch (socketErr) {
          console.warn('[chat-ui] socket send failed, fallback to REST', socketErr);
          const { data } = await chatApi.sendMessage(trimmed);
          appendMessage((data.message ?? {}) as unknown as Record<string, unknown>);
        }
      } catch (err: unknown) {
        console.error('[chat-ui] send failed', err);
        const axiosErr = err as { message?: string; code?: string };
        const msg =
          axiosErr.code === 'ERR_NETWORK' || axiosErr.message === 'Network Error'
            ? 'Сервер недоступен. Сообщение не отправлено — попробуйте через несколько секунд.'
            : err instanceof Error
              ? err.message
              : 'Не удалось отправить сообщение';
        setError(msg);
      } finally {
        setSending(false);
      }
    },
    [token, appendMessage],
  );

  return {
    messages,
    loading,
    sending,
    error,
    unreadCount,
    isConnected,
    isReconnecting,
    isAuthenticated,
    sendMessage,
    loadMessages,
    markAsRead,
  };
}
