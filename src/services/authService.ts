import { apiClient } from '../config/api';
import type { User } from '../store/authStore';

export interface LoginRequest {
  identifier: string; // Can be email or phone
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirmation: string;
  dateOfBirth?: string;
  gender?: string;
  emergencyContact?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

export interface GoogleLoginRequest {
  idToken: string;
  phone?: string;
}

function normalizeAuthResponse(payload: any): AuthResponse {
  const user = payload?.data?.user ?? payload?.user;
  const token = payload?.data?.token ?? payload?.token;
  return {
    success: Boolean(payload?.success),
    message: String(payload?.message ?? ''),
    user: user ?? undefined,
    token: token ?? undefined,
  };
}

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    // Detect if identifier is email or phone
    const isEmail = data.identifier.includes('@');
    const payload = isEmail 
      ? { email: data.identifier, password: data.password }
      : { phone: data.identifier, password: data.password };
    
    const response = await apiClient.post('/auth/login', payload);
    return normalizeAuthResponse(response.data);
  },

  async googleLogin(data: GoogleLoginRequest): Promise<AuthResponse> {
    const payload = {
      id_token: data.idToken,
      phone: data.phone,
    };
    const response = await apiClient.post('/auth/google', payload);
    return normalizeAuthResponse(response.data);
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const payload = {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      password: data.password,
      password_confirmation: data.passwordConfirmation,
      date_of_birth: data.dateOfBirth,
      gender: data.gender,
      emergency_contact_name: data.emergencyContact,
    };

    const response = await apiClient.post('/auth/register', payload);
    return normalizeAuthResponse(response.data);
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data.data?.user ?? null;
    } catch {
      return null;
    }
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(data: { email: string; password: string; token: string }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/auth/reset-password', data);
    return response.data;
  },
};
