import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

export type User = {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone: string;
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setAuth: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: async (user, token) => {
        await SecureStore.setItemAsync('auth_token', token);
        await SecureStore.setItemAsync('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true, isLoading: false });
      },

      logout: async () => {
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('user');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      },

      loadAuth: async () => {
        console.log('🔄 Loading auth...');
        try {
          const token = await SecureStore.getItemAsync('auth_token');
          const userStr = await SecureStore.getItemAsync('user');
          console.log('🔑 Token exists:', !!token);
          console.log('👤 User exists:', !!userStr);
          if (token && userStr) {
            const user = JSON.parse(userStr);
            set({ user, token, isAuthenticated: true, isLoading: false });
            console.log('✅ Auth loaded - authenticated');
          } else {
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
            console.log('❌ No auth found - not authenticated');
          }
        } catch (error) {
          console.error('❌ Failed to load auth:', error);
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => SecureStore),
    }
  )
);
