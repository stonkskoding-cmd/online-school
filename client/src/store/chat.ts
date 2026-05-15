import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { Message, Conversation } from '@/types';
import { chatAPI } from '@/services/api';

interface ChatState {
  socket: Socket | null;
  isConnected: boolean;
  messages: Message[];
  conversations: Conversation[];
  activeConversation: string | null;
  initializeSocket: (token: string) => void;
  disconnectSocket: () => void;
  sendMessage: (text: string, userId?: string) => Promise<void>;
  loadMessages: (userId?: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  setActiveConversation: (userId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  isConnected: false,
  messages: [],
  conversations: [],
  activeConversation: null,
  
  initializeSocket: (token) => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    socket.on('message', (message: Message) => {
      set((state) => ({
        messages: [...state.messages, message],
      }));
    });

    socket.on('newMessage', (data: { userId: string; message: Message }) => {
      const state = get();
      if (state.conversations.some(c => c.userId === data.userId)) {
        get().loadConversations();
      }
    });

    set({ socket });
  },
  
  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },
  
  sendMessage: async (text, userId) => {
    const { socket } = get();
    if (!socket) return;

    return new Promise((resolve, reject) => {
      const event = userId ? 'admin:message' : 'message';
      const payload = userId ? { userId, text } : { text };
      
      socket.emit(event, payload, (response: { success: boolean; error?: string; message: Message }) => {
        if (response.success) {
          set((state) => ({
            messages: [...state.messages, response.message],
          }));
          resolve();
        } else {
          reject(response.error);
        }
      });
    });
  },
  
  loadMessages: async (userId) => {
    try {
      const response = await chatAPI.getMessages(userId);
      set({ messages: response.data.messages });
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  },
  
  loadConversations: async () => {
    try {
      const response = await chatAPI.getConversations();
      set({ conversations: response.data.conversations });
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  },
  
  setActiveConversation: (userId) => {
    set({ activeConversation: userId });
  },
}));
