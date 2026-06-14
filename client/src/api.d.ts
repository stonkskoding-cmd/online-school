export interface ApiChatMessage {
  id: number | string;
  senderId?: string;
  userId?: string;
  content: string;
  isAdmin: boolean;
  isRead?: boolean;
  createdAt: string;
}

export interface AdminChatSummary {
  userId: string;
  email: string;
  name?: string;
  lastMessage?: {
    id?: number;
    content: string;
    createdAt: string;
    isAdmin: boolean;
  } | null;
  unreadCount?: number;
  messageCount?: number;
}

export declare const chatApi: {
  getMessages: () => Promise<{ data: ApiChatMessage[] }>;
  sendMessage: (content: string) => Promise<{ data: ApiChatMessage }>;
  getChats: () => Promise<{ data: Array<{ userId: string; messageCount: number; lastMessageAt: string }> }>;
  deleteChat: (userId: string) => Promise<{ data: { success: boolean } }>;
};

export declare const adminApiClient: {
  adminChats: () => Promise<{ data: { chats: AdminChatSummary[]; totalUnread: number } }>;
  adminChatThread: (userId: string) => Promise<{ data: { messages: ApiChatMessage[] } }>;
  postAdminChatMessage: (payload: { userId: string; content: string }) => Promise<{ data: { message: ApiChatMessage } }>;
  deleteAdminChat: (userId: string) => Promise<{ data: { message: string } }>;
};

export declare const authApi: Record<string, unknown>;
export declare const packagesApi: Record<string, unknown>;
export declare const purchasesApi: Record<string, unknown>;

declare const api: unknown;
export default api;
