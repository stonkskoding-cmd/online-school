import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { User } from '@/types';
import { authAPI } from '@/services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      
      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await authAPI.login({ email, password });
          set({ user: response.data.user, isAuthenticated: true, loading: false });
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Login failed', loading: false });
          throw error;
        }
      },
      
      register: async (email, password, firstName, lastName) => {
        set({ loading: true, error: null });
        try {
          const response = await authAPI.register({ email, password, firstName, lastName });
          set({ user: response.data.user, isAuthenticated: true, loading: false });
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Registration failed', loading: false });
          throw error;
        }
      },
      
      logout: async () => {
        set({ loading: true });
        try {
          await authAPI.logout();
          set({ user: null, isAuthenticated: false, loading: false });
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Logout failed', loading: false });
        }
      },
      
      fetchUser: async () => {
        set({ loading: true });
        try {
          const response = await authAPI.me();
          set({ user: response.data.user, isAuthenticated: true, loading: false });
        } catch (error: any) {
          set({ user: null, isAuthenticated: false, loading: false });
        }
      },
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
