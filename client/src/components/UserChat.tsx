import React, { useState, useEffect } from 'react';
import { chatApi, type ApiChatMessage } from '../api';
import { canUseSupportChat } from '../utils/authToken';

const ChatIcon = () => (
  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

export const UserChat: React.FC = () => {
  const chatReady = canUseSupportChat();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ApiChatMessage[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchMessages = async () => {
    try {
      const response = await chatApi.getMessages();
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  useEffect(() => {
    const openChat = () => setIsOpen(true);
    window.addEventListener('open-support-chat', openChat);
    return () => window.removeEventListener('open-support-chat', openChat);
  }, []);

  useEffect(() => {
    if (!isOpen || !chatReady) return undefined;
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [isOpen, chatReady]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      await chatApi.sendMessage(content);
      setContent('');
      await fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Ошибка отправки сообщения');
    } finally {
      setLoading(false);
    }
  };

  if (!chatReady) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-gray-200 bg-white shadow-lg transition-all hover:scale-110 hover:shadow-xl"
        aria-label="Открыть чат поддержки"
      >
        <ChatIcon />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white md:inset-auto md:bottom-6 md:right-6 md:h-[32rem] md:w-96 md:rounded-lg md:border md:border-gray-200 md:shadow-2xl">
      <div className="flex shrink-0 items-center justify-between rounded-t-lg border-b bg-blue-600 p-4 text-white">
        <h3 className="font-semibold">Поддержка</h3>
        <button type="button" onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200" aria-label="Закрыть">
          ✕
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4 md:h-96">
        {messages.length === 0 ? (
          <p className="mt-20 text-center text-gray-500">
            Напишите нам — администратор ответит в этом чате.
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[85%] rounded-lg p-3 ${
                msg.isAdmin
                  ? 'ml-auto bg-gray-100'
                  : 'mr-auto bg-blue-600 text-white'
              }`}
            >
              <p>{msg.content}</p>
              <span className="mt-1 block text-xs opacity-70">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>

      <form onSubmit={sendMessage} className="flex shrink-0 gap-2 border-t p-3 sm:p-4">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ваше сообщение..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '...' : '➤'}
        </button>
      </form>
    </div>
  );
};

export default UserChat;
