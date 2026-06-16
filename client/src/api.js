import axios from 'axios';
import { getAdminBearerToken, clearAdminSession } from './utils/adminAuth';
import { getBearerToken } from './utils/authToken';

const BACKEND_API = 'https://online-school-backend-mqn9.onrender.com/api';

function resolveApiBaseURL() {
  let raw = (import.meta.env.VITE_API_URL || BACKEND_API).trim().replace(/\/$/, '');
  if (raw.includes('frontend') || raw.includes('online-school-frontend')) {
    console.warn('[api] VITE_API_URL указывает на frontend — используем backend');
    raw = BACKEND_API.replace(/\/api$/, '');
  }
  return raw.endsWith('/api') ? raw : `${raw}/api`;
}

const apiBaseURL = resolveApiBaseURL();
console.log('[api] baseURL:', apiBaseURL);

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
  packageStats: () => adminApi.get('/admin/packages/stats'),
  createPackage: (payload) => adminApi.post('/admin/packages', payload),
  updatePackage: (id, payload) => adminApi.put(`/admin/packages/${id}`, payload),
  deletePackage: (id) => adminApi.delete(`/admin/packages/${id}`),
  adminChats: () => adminApi.get('/admin/chats'),
  adminChatThread: (userId) => adminApi.get(`/admin/chats/${userId}`),
  postAdminChatMessage: (payload) => adminApi.post('/admin/message', payload),
  clearAdminChat: (userId) => adminApi.delete(`/admin/chats/${userId}/clear`),
  deleteAdminChat: (userId) => adminApi.delete(`/admin/chats/${userId}`),
  deleteAdminMessage: (messageId) => adminApi.delete(`/admin/message/${messageId}`),
  getSiteSettings: () => adminApi.get('/site-settings'),
  updateSiteSettings: (settings) => adminApi.put('/site-settings/bulk', { settings }),
  resetFooterSettings: () => adminApi.post('/site-settings/footer/reset'),
};

export const siteSettingsApi = {
  get: () => api.get('/site-settings'),
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
  getMessages: () => api.get('/chat/messages'),
  sendMessage: (content) => api.post('/chat/messages', { content }),
  getChats: () => api.get('/chat/chats'),
  deleteChat: (userId) => api.delete(`/chat/chats/${userId}`),
};

export default api;
