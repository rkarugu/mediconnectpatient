import axios, { AxiosInstance } from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const inferredHost = (() => {
  const constantsAny = Constants as any;
  const hostUri: string | undefined =
    constantsAny?.expoConfig?.hostUri ?? 
    constantsAny?.expoGoConfig?.debuggerHost ?? 
    constantsAny?.manifest?.debuggerHost ?? 
    constantsAny?.manifest2?.extra?.expoGo?.debuggerHost;

  return hostUri ? hostUri.split(':')[0] : undefined;
})();

const DEFAULT_API_BASE_URL = 'http://10.210.19.13:8000/api';
const DEFAULT_SOCKET_URL = 'http://10.210.19.13:8000';

// Read from Expo environment variables (EXPO_PUBLIC_*)
const env = ((globalThis as any)?.process?.env ?? {}) as Record<string, string | undefined>;

export const API_BASE_URL = env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
export const SOCKET_URL = env.EXPO_PUBLIC_SOCKET_URL ?? DEFAULT_SOCKET_URL;

console.log('API Base URL:', API_BASE_URL);
console.log('Socket URL:', SOCKET_URL);

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
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      await SecureStore.deleteItemAsync('auth_token');
      // TODO: trigger logout navigation
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
