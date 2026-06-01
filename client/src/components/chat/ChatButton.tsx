import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useChat } from '../../hooks/useChat';
import { getBearerToken } from '../../utils/authToken';
import ChatWindow from './ChatWindow';

export default function ChatButton() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const openChat = () => setIsOpen(true);
    window.addEventListener('open-support-chat', openChat);
    return () => window.removeEventListener('open-support-chat', openChat);
  }, []);

  useEffect(() => {
    const token = getBearerToken();
    console.log('[CHAT] ChatButton token:', token ? 'Present' : 'Missing');
  }, [isOpen]);

  const {
    messages,
    loading,
    sending,
    error,
    unreadCount,
    isConnected,
    isReconnecting,
    isAuthenticated,
    sendMessage,
  } = useChat(isOpen);

  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return null;
  }

  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <>
      <button
        id="chat-floating-button"
        type="button"
        onClick={toggle}
        aria-label={isOpen ? 'Закрыть чат' : 'Открыть чат поддержки'}
        aria-expanded={isOpen}
        className="group fixed bottom-6 right-6 z-[1000] flex h-20 w-20 items-center justify-center rounded-full bg-white text-blue-600 shadow-xl ring-1 ring-gray-200/80 transition duration-300 hover:scale-110 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/30"
      >
        {!isOpen && unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white shadow-md">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}

        {isOpen ? (
          <svg className="h-9 w-9 text-[#2563eb]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <svg className="h-9 w-9 text-[#2563eb]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        )}
      </button>

      <ChatWindow
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        messages={messages}
        loading={loading}
        sending={sending}
        error={error}
        isConnected={isConnected}
        isReconnecting={isReconnecting}
        isAuthenticated={isAuthenticated}
        onSend={sendMessage}
      />
    </>
  );
}
