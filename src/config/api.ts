import axios, { AxiosInstance } from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../store/authStore';

const inferredHost = (() => {
  const constantsAny = Constants as any;
  const hostUri: string | undefined =
    constantsAny?.expoConfig?.hostUri ?? 
    constantsAny?.expoGoConfig?.debuggerHost ?? 
    constantsAny?.manifest?.debuggerHost ?? 
    constantsAny?.manifest2?.extra?.expoGo?.debuggerHost;

  return hostUri ? hostUri.split(':')[0] : undefined;
})();

const DEFAULT_API_BASE_URL = 'https://sys.mediconnect.africa/api';
const DEFAULT_SOCKET_URL = 'https://sys.mediconnect.africa';

// Read from Expo environment variables (EXPO_PUBLIC_*)
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? DEFAULT_SOCKET_URL;

// Storage URL for accessing uploaded files (images, documents, etc.)
// Derived from API_BASE_URL by replacing /api with /storage/
export const STORAGE_URL = API_BASE_URL.replace('/api', '/storage');

console.log('API Base URL:', API_BASE_URL);
console.log('Socket URL:', SOCKET_URL);
console.log('Storage URL:', STORAGE_URL);

// Create Axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const storeToken = useAuthStore.getState().token;
      const secureToken = await SecureStore.getItemAsync('auth_token');
      const token = secureToken || storeToken;
      console.log('🔑 API Request - Token exists:', !!token);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Authorization header set');
      } else {
        console.warn('⚠️ No token found in SecureStore or store');
      }
    } catch (error) {
      console.error('❌ Error getting token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const authHeader = error.config?.headers?.Authorization || error.config?.headers?.authorization;
      if (authHeader) {
        await useAuthStore.getState().logout();
        console.warn('⚠️ 401 received with auth header - logging out');
      } else {
        console.warn('⚠️ 401 received without auth header - not logging out');
      }
    }
    return Promise.reject(error);
  }
);

// Helper to make requests without auth token
export const publicApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});
