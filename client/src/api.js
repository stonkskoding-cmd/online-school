import axios from 'axios';
import { getAdminBearerToken, clearAdminSession } from './utils/adminAuth';
import { getBearerToken } from './utils/authToken';

const apiBaseURL =
  import.meta.env.VITE_API_URL || 'https://online-school-backend-mqn9.onrender.com/api';

const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = getBearerToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[api] Authorization Bearer set:', config.method?.toUpperCase(), config.url ?? '');
  }
  return config;
});

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  adminLogin: (payload) => api.post('/auth/admin-login', payload),
  me: () => api.get('/auth/me'),
};

const adminApi = axios.create({
  baseURL: apiBaseURL,
  withCredentials: false,
});

adminApi.interceptors.request.use((config) => {
  const bearer = getAdminBearerToken();
  if (bearer) {
    config.headers.Authorization = `Bearer ${bearer}`;
    console.log('[admin-api] Sending request with token:', config.method?.toUpperCase(), config.url);
  } else {
    console.warn('[admin-api] No admin token — request may fail:', config.method?.toUpperCase(), config.url);
  }
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error('[admin-api] Auth failed:', error.response?.status, error.response?.data?.message);
      clearAdminSession();
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        const onAdminArea =
          path.startsWith('/admin') &&
          !path.startsWith('/admin/login') &&
          path !== '/admin-login';
        if (onAdminArea) {
          window.location.href = '/admin/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export const adminApiClient = {
  stats: () => adminApi.get('/admin/stats'),
  packages: () => adminApi.get('/admin/packages'),
  createPackage: (payload) => adminApi.post('/admin/packages', payload),
  updatePackage: (id, payload) => adminApi.put(`/admin/packages/${id}`, payload),
  deletePackage: (id) => adminApi.delete(`/admin/packages/${id}`),
  uploadFile: (formData) => adminApi.post('/upload', formData),
  uploadFileWithProgress: (formData, onProgress) =>
    adminApi.post('/upload', formData, {
      onUploadProgress: (evt) => {
        if (evt.total && onProgress) {
          onProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      },
    }),
  adminChats: () => adminApi.get('/admin/chats'),
  adminChatThread: (userId) => adminApi.get(`/admin/chats/${userId}`),
  postAdminChatMessage: (payload) => adminApi.post('/admin/message', payload),
  deleteAdminChat: (userId) => adminApi.delete(`/admin/chats/${userId}`),
  deleteAdminMessage: (messageId) => adminApi.delete(`/admin/message/${messageId}`),
};

export const packagesApi = {
  list: (category) => api.get('/packages', { params: category ? { category } : {} }),
  getBySlug: (slug) => api.get(`/packages/${slug}`),
  getById: (id) => api.get(`/packages/id/${id}`),
  getContent: (slug) => api.get(`/packages/${slug}/content`),
};

export const purchasesApi = {
  list: () => api.get('/purchases'),
  create: (packageId) => api.post('/purchases', { packageId }),
};

export const chatApi = {
  getMy: () => api.get('/chat/my'),
  getMessages: () => api.get('/chat/messages'),
  getChatMessages: (chatId) => api.get(`/chat/${chatId}/messages`),
  getHistory: (userId) => api.get(`/chat/history/${userId}`),
  getUnreadCount: () => api.get('/chat/unread-count'),
  markRead: (chatId) => api.patch(`/chat/${chatId}/read`),
  sendMessage: (text) => api.post('/chat/messages', { text, content: text }),
  sendToChat: (chatId, content) => api.post(`/chat/${chatId}/message`, { content }),
  clearChat: (chatId) => api.delete(`/chat/${chatId}/clear`),
  deleteChat: (chatId) => api.delete(`/chat/${chatId}`),
};

export default api;
