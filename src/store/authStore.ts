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
  date_of_birth?: string;
  gender?: string;
  blood_type?: string;
  allergies?: string;
  medical_conditions?: string;
  address?: string;
  city?: string;
  state?: string;
  profile_picture?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  wallet_balance?: number;
};

const readPersistedAuth = async () => {
  try {
    const persisted = await SecureStore.getItemAsync('auth-storage');
    if (!persisted) return { token: null, user: null };
    const parsed = JSON.parse(persisted);
    return {
      token: parsed?.state?.token ?? null,
      user: parsed?.state?.user ?? null,
    };
  } catch (error) {
    console.error('Error reading persisted auth:', error);
    return { token: null, user: null };
  }
};

export type Dependant = {
  id?: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  relationship: string;
  blood_type?: string;
  allergies?: string;
  medical_conditions?: string;
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setAuth: (user: User, token: string) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

// Custom storage implementation for Zustand that doesn't conflict with SecureStore
const customStorage = {
  getItem: async (name: string) => {
    try {
      const value = await SecureStore.getItemAsync(name);
      return value;
    } catch (error) {
      console.error('Error reading from SecureStore:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.error('Error writing to SecureStore:', error);
    }
  },
  removeItem: async (name: string) => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.error('Error removing from SecureStore:', error);
    }
  },
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: async (user, token) => {
        console.log('💾 Saving auth - Token length:', token?.length);
        await SecureStore.setItemAsync('auth_token', token);
        await SecureStore.setItemAsync('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true, isLoading: false });
        console.log('✅ Auth saved to SecureStore');
      },

      updateUser: async (user) => {
        const currentState = get();
        const token = currentState.token || await SecureStore.getItemAsync('auth_token');
        console.log('🔄 Updating user - Token exists:', !!token);
        if (token) {
          await SecureStore.setItemAsync('auth_token', token);
          await SecureStore.setItemAsync('user', JSON.stringify(user));
          set({ user, token, isAuthenticated: true });
          console.log('✅ User updated in store');
        } else {
          console.error('❌ Cannot update user - no token found');
        }
      },

      logout: async () => {
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('user');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      },

      loadAuth: async () => {
        console.log('🔄 Loading auth...');
        try {
          let token = await SecureStore.getItemAsync('auth_token');
          let userStr = await SecureStore.getItemAsync('user');

          if (!token || !userStr) {
            const persisted = await readPersistedAuth();
            token = token || persisted.token;
            if (!userStr && persisted.user) {
              userStr = JSON.stringify(persisted.user);
            }
          }

          console.log('🔑 Token exists:', !!token);
          console.log('👤 User exists:', !!userStr);
          if (token && userStr) {
            const user = JSON.parse(userStr);
            set({ user, token, isAuthenticated: true, isLoading: false });
            await SecureStore.setItemAsync('auth_token', token);
            await SecureStore.setItemAsync('user', JSON.stringify(user));
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
      storage: createJSONStorage(() => customStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
