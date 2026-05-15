import axios from 'axios';
import { isValidAdminToken } from './utils/adminAuth';

/** Прод: VITE_API_URL=https://your-api.onrender.com/api; локально без .env — http://localhost:5000/api */
const apiBaseURL =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
  const adminToken = localStorage.getItem('adminToken');
  const userToken = localStorage.getItem('token');
  const bearer =
    adminToken && isValidAdminToken(adminToken)
      ? adminToken
      : userToken && isValidAdminToken(userToken)
        ? userToken
        : null;
  if (bearer) {
    config.headers.Authorization = `Bearer ${bearer}`;
  }
  return config;
});

export const adminApiClient = {
  stats: () => adminApi.get('/admin/stats'),
  packages: () => adminApi.get('/admin/packages'),
  createPackage: (payload) => adminApi.post('/admin/packages', payload),
  updatePackage: (id, payload) => adminApi.put(`/admin/packages/${id}`, payload),
  deletePackage: (id) => adminApi.delete(`/admin/packages/${id}`),
  uploadFile: (formData) => adminApi.post('/upload', formData),
  adminChats: () => adminApi.get('/admin/chats'),
  adminChatThread: (userId) => adminApi.get(`/admin/chats/${userId}`),
  postAdminChatMessage: (payload) => adminApi.post('/admin/message', payload),
  deleteAdminChat: (userId) => adminApi.delete(`/admin/chats/${userId}`),
  deleteAdminMessage: (messageId) => adminApi.delete(`/admin/message/${messageId}`),
};

export const packagesApi = {
  list: (category) => api.get('/packages', { params: category ? { category } : {} }),
};

export const purchasesApi = {
  list: () => api.get('/purchases'),
  create: (packageId) => api.post('/purchases', { packageId }),
};

export default api;
