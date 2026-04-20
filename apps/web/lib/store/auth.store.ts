import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, type User } from '../api';
import { useFavoritesStore } from './favorites.store';

interface AuthState {
  user:        User | null;
  accessToken: string | null;
  sessionId:   string;          // анонимный session id

  login:    (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout:   () => void;
  hydrate:  () => Promise<void>;
}

function generateSessionId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:        null,
      accessToken: null,
      sessionId:   generateSessionId(),

      login: async (email, password) => {
        const res = await authApi.login({ email, password });
        localStorage.setItem('accessToken', res.accessToken);
        set({ user: res.user, accessToken: res.accessToken });
        useFavoritesStore.getState().reset();
        useFavoritesStore.getState().load();
      },

      register: async (email, password, name) => {
        const res = await authApi.register({ email, password, name });
        localStorage.setItem('accessToken', res.accessToken);
        set({ user: res.user, accessToken: res.accessToken });
        useFavoritesStore.getState().reset();
        useFavoritesStore.getState().load();
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        useFavoritesStore.getState().reset();
        set({ user: null, accessToken: null, sessionId: generateSessionId() });
      },

      hydrate: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        try {
          const user = await authApi.me();
          set({ user, accessToken: token });
        } catch {
          localStorage.removeItem('accessToken');
          set({ user: null, accessToken: null });
        }
      },
    }),
    {
      name: 'estate-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        sessionId:   state.sessionId,
      }),
    },
  ),
);
