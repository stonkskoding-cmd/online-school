import { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminChatList from './AdminChatList';
import AdminChatWindow from './AdminChatWindow';
import { useAdminChat } from '../../hooks/useAdminChat';

/** Админ: список чатов слева, переписка справа */
export default function AdminChatPanel() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const {
    threads,
    messages,
    loadingThreads,
    loadingMessages,
    sending,
    error,
    totalUnread,
    sendMessage,
    clearHistory,
    deleteChat,
  } = useAdminChat(selectedUserId);

  const selectedEmail = threads.find((t) => t.userId === selectedUserId)?.email ?? '';

  const handleDelete = async () => {
    const ok = await deleteChat();
    if (ok) setSelectedUserId(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-[#244E77]">Чат поддержки</h1>
          <p className="text-xs text-gray-500">
            {totalUnread > 0 ? `${totalUnread} непрочитанных` : 'Все прочитано'}
          </p>
        </div>
        <Link
          to="/admin/dashboard"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Админка
        </Link>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col md:flex-row md:gap-4 md:p-4">
        <aside className="w-full shrink-0 border-b border-gray-200 bg-white md:w-80 md:rounded-xl md:border md:shadow-sm">
          <div className="border-b border-gray-100 px-4 py-2 text-xs font-semibold uppercase text-gray-500">
            Чаты с клиентами
          </div>
          <div className="max-h-56 overflow-y-auto md:max-h-[calc(100vh-11rem)]">
            <AdminChatList
              threads={threads}
              selectedUserId={selectedUserId}
              loading={loadingThreads}
              onSelect={setSelectedUserId}
            />
          </div>
        </aside>

        <main className="flex min-h-[50vh] flex-1 flex-col overflow-hidden bg-white md:min-h-0 md:rounded-xl md:border md:shadow-sm">
          {selectedUserId ? (
            <AdminChatWindow
              userEmail={selectedEmail}
              messages={messages}
              loading={loadingMessages}
              sending={sending}
              error={error}
              onSend={sendMessage}
              onClearHistory={clearHistory}
              onDeleteChat={handleDelete}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-gray-500">
              Выберите чат слева, чтобы ответить клиенту.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
