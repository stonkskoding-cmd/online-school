import React, { useState, useEffect } from 'react';
import { chatApi, type ApiChatMessage } from '../api';
import { canUseSupportChat } from '../utils/authToken';

export const UserChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ApiChatMessage[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  if (!canUseSupportChat()) {
    return null;
  }

  const fetchMessages = async () => {
    try {
      const response = await chatApi.getMessages();
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isOpen]);

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

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 z-50"
      >
        💬 Поддержка
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
      <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
        <h3 className="font-semibold">Поддержка</h3>
        <button type="button" onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
          ✕
        </button>
      </div>

      <div className="h-96 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center mt-20">
            Напишите нам — администратор ответит в этом чате.
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 rounded-lg ${
                msg.isAdmin
                  ? 'bg-gray-100 ml-auto max-w-xs'
                  : 'bg-blue-600 text-white mr-auto max-w-xs'
              }`}
            >
              <p>{msg.content}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ваше сообщение..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '...' : '➤'}
        </button>
      </form>
    </div>
  );
};

export default UserChat;
