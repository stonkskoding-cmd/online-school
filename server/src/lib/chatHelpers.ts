/** Тред поддержки = userId клиента (модель Message без отдельной таблицы Chat). */
export function chatIdFromUserId(userId: string): string {
  return userId;
}

export function serializeMessage(msg: {
  id: number;
  userId: string;
  content: string;
  isAdmin: boolean;
  isRead: boolean;
  createdAt: Date;
}) {
  return {
    id: msg.id,
    chatId: msg.userId,
    userId: msg.userId,
    senderId: msg.isAdmin ? 'admin' : msg.userId,
    content: msg.content,
    isAdmin: msg.isAdmin,
    isRead: msg.isRead,
    createdAt: msg.createdAt,
  };
}
