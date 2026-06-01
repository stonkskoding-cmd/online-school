import type { ChatMessageItem } from '../../hooks/useChat';

interface ChatMessageProps {
  message: ChatMessageItem;
  /** В админ-панели: свои (админ) справа, клиент слева */
  viewAsAdmin?: boolean;
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function ChatMessage({ message, viewAsAdmin = false }: ChatMessageProps) {
  const isOwn = viewAsAdmin ? message.isFromAdmin : !message.isFromAdmin;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
          isOwn
            ? 'rounded-br-md bg-gradient-to-br from-blue-600 to-blue-700 text-white'
            : 'rounded-bl-md bg-gray-100 text-gray-800 ring-1 ring-gray-200'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        <p className={`mt-1 text-[10px] ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
