/** Тред поддержки = userId клиента (модель Message без отдельной таблицы Chat). */
export function chatIdFromUserId(userId: string): string {
  return userId;
}

/** Текст сообщения из body (принимает content или legacy text с клиента) */
export function parseMessageContent(body: unknown): string {
  if (body == null) return '';
  if (typeof body === 'string') return body.trim();
  if (typeof body === 'object') {
    const record = body as Record<string, unknown>;
    return String(record.content ?? record.text ?? '').trim();
  }
  return '';
}

/** senderId для записи в БД */
export function resolveSenderId(userId: string, isAdmin: boolean): string {
  if (isAdmin) return 'admin';
  return userId;
}

/** Данные для prisma.message.create */
export function buildMessageCreateData(
  threadUserId: string,
  senderId: string,
  content: string,
  isAdmin: boolean,
): {
  userId: string;
  senderId: string;
  content: string;
  isAdmin: boolean;
  isRead: boolean;
} {
  return {
    userId: threadUserId,
    senderId,
    content,
    isAdmin,
    isRead: isAdmin,
  };
}

export function serializeMessage(msg: {
  id: number;
  userId: string;
  senderId: string;
  content: string;
  isAdmin: boolean;
  isRead: boolean;
  createdAt: Date;
}) {
  return {
    id: msg.id,
    chatId: msg.userId,
    userId: msg.userId,
    senderId: msg.senderId,
    content: msg.content,
    isAdmin: msg.isAdmin,
    isRead: msg.isRead,
    createdAt: msg.createdAt,
  };
}
