import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatApi, type ApiChatMessage } from '../api';
import { canUseSupportChat } from '../utils/authToken';

const POLL_INTERVAL_MS = 8000;

function ChatIcon() {
  return (
    <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

function ChatFab({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="support-chat-fab group"
      aria-label="Открыть чат поддержки"
    >
      <span className="support-chat-fab__pulse" aria-hidden />
      <span className="support-chat-fab__glow" aria-hidden />
      <span className="support-chat-fab__btn">
        <ChatIcon />
      </span>
      <span className="support-chat-fab__tooltip" aria-hidden>
        Поддержка
      </span>
    </button>
  );
}

function ChatPanelShell({
  children,
  onClose,
  className = '',
}: {
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}) {
  return (
    <div className={`support-chat-panel ${className}`}>
      <div className="support-chat-panel__header">
        <div className="flex items-center gap-2">
          <span className="support-chat-panel__status" aria-hidden />
          <h3 className="text-sm font-semibold sm:text-base">Поддержка</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="support-chat-panel__close"
          aria-label="Закрыть чат"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {children}
    </div>
  );
}

export const UserChat: React.FC = () => {
  const navigate = useNavigate();
  const chatReady = canUseSupportChat();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ApiChatMessage[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await chatApi.getMessages();
      setMessages(response.data);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to fetch messages:', error);
      }
    }
  }, []);

  useEffect(() => {
    const openChat = () => setIsOpen(true);
    window.addEventListener('open-support-chat', openChat);
    return () => window.removeEventListener('open-support-chat', openChat);
  }, []);

  useEffect(() => {
    if (!isOpen || !chatReady) return undefined;

    fetchMessages();

    const tick = () => {
      if (document.visibilityState === 'visible') {
        fetchMessages();
      }
    };

    const interval = window.setInterval(tick, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [isOpen, chatReady, fetchMessages]);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isOpen, messages]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    try {
      await chatApi.sendMessage(content);
      setContent('');
      await fetchMessages();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to send message:', error);
      }
      alert('Ошибка отправки сообщения');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return <ChatFab onOpen={() => setIsOpen(true)} />;
  }

  return (
    <>
      <button
        type="button"
        className="support-chat-backdrop md:hidden"
        onClick={() => setIsOpen(false)}
        aria-label="Закрыть чат"
      />

      {!chatReady ? (
        <ChatPanelShell onClose={() => setIsOpen(false)}>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="text-sm text-gray-600 sm:text-base">
              Войдите в аккаунт, чтобы написать в чат поддержки. Мы ответим вам здесь же.
            </p>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/?auth=login');
              }}
              className="btn-brand px-5 py-2.5 text-sm"
            >
              Войти
            </button>
          </div>
        </ChatPanelShell>
      ) : (
        <ChatPanelShell onClose={() => setIsOpen(false)} className="support-chat-panel--ready">
          <div className="support-chat-panel__messages">
            {messages.length === 0 ? (
              <p className="mt-16 text-center text-sm text-gray-500">
                Напишите нам — администратор ответит в этом чате.
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`support-chat-bubble ${
                    msg.isAdmin ? 'support-chat-bubble--admin' : 'support-chat-bubble--user'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <span className="support-chat-bubble__time">
                    {new Date(msg.createdAt).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="support-chat-panel__form">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ваше сообщение..."
              className="support-chat-panel__input"
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="support-chat-panel__send"
              aria-label="Отправить сообщение"
            >
              {loading ? (
                <span className="support-chat-panel__spinner" aria-hidden />
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </button>
          </form>
        </ChatPanelShell>
      )}
    </>
  );
};

export default memo(UserChat);
