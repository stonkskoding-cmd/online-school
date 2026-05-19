import axios from 'axios';
import { User, Package, Purchase, Message, Conversation } from '@/types';

/** Синхронно с client/src/api.js (если store подключат позже) */
const API_URL = 'https://online-school-1it4.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Response interceptor for handling 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        return api.request(error.config);
      } catch (refreshError) {
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: { email: string; password: string; firstName?: string; lastName?: string }) =>
    api.post<{ message: string; user: User }>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ message: string; user: User }>('/auth/login', data),
  logout: () => api.post<{ message: string }>('/auth/logout'),
  me: () => api.get<{ user: User }>('/auth/me'),
};

export const packagesAPI = {
  getAll: (category?: string) =>
    api.get<{ packages: Package[] }>('/packages', { params: { category } }),
  getBySlug: (slug: string) =>
    api.get<{ package: Package }>(`/packages/${slug}`),
  getContent: (slug: string) =>
    api.get<{ package: Package }>(`/packages/${slug}/content`),
  create: (data: any) => api.post('/packages', data),
  update: (id: string, data: any) => api.put(`/packages/${id}`, data),
  delete: (id: string) => api.delete(`/packages/${id}`),
};

export const purchasesAPI = {
  create: (packageId: string) =>
    api.post<{ purchase: Purchase; confirmationUrl: string }>('/purchases', { packageId }),
  getAll: () => api.get<{ purchases: Purchase[] }>('/purchases'),
};

export const chatAPI = {
  getMessages: (userId?: string) =>
    api.get<{ messages: Message[] }>('/chat/messages', { params: { userId } }),
  getConversations: () =>
    api.get<{ conversations: Conversation[] }>('/chat/conversations'),
};

export default api;
