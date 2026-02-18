import { apiClient } from '../config/api';
import type { User, Dependant } from '../store/authStore';

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  blood_type?: string;
  allergies?: string;
  medical_conditions?: string;
  address?: string;
  city?: string;
  state?: string;
}

export interface UpdateNextOfKinRequest {
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  user?: User;
}

export interface DependantsResponse {
  success: boolean;
  message: string;
  dependants?: Dependant[];
}

export const profileService = {
  async updateProfile(data: UpdateProfileRequest): Promise<ProfileResponse> {
    const response = await apiClient.put('/auth/profile', data);
    return {
      success: response.data.success,
      message: response.data.message,
      user: response.data.data,
    };
  },

  async updateNextOfKin(data: UpdateNextOfKinRequest): Promise<ProfileResponse> {
    const response = await apiClient.put('/auth/profile', data);
    return {
      success: response.data.success,
      message: response.data.message,
      user: response.data.data,
    };
  },

  async getDependants(): Promise<DependantsResponse> {
    const response = await apiClient.get('/auth/dependants');
    return response.data;
  },

  async createDependant(data: Dependant): Promise<DependantsResponse> {
    const payload = {
      first_name: data.first_name,
      last_name: data.last_name,
      date_of_birth: data.date_of_birth,
      gender: data.gender,
      relationship: data.relationship,
      blood_type: data.blood_type,
      allergies: data.allergies,
      medical_conditions: data.medical_conditions,
    };
    const response = await apiClient.post('/auth/dependants', payload);
    return response.data;
  },

  async updateDependant(id: number, data: Dependant): Promise<DependantsResponse> {
    const payload = {
      first_name: data.first_name,
      last_name: data.last_name,
      date_of_birth: data.date_of_birth,
      gender: data.gender,
      relationship: data.relationship,
      blood_type: data.blood_type,
      allergies: data.allergies,
      medical_conditions: data.medical_conditions,
    };
    const response = await apiClient.put(`/auth/dependants/${id}`, payload);
    return response.data;
  },

  async deleteDependant(id: number): Promise<DependantsResponse> {
    const response = await apiClient.delete(`/auth/dependants/${id}`);
    return response.data;
  },

  async saveDependants(dependants: Dependant[]): Promise<DependantsResponse> {
    const payload = dependants.map(d => ({
      id: d.id,
      first_name: d.first_name,
      last_name: d.last_name,
      date_of_birth: d.date_of_birth,
      gender: d.gender,
      relationship: d.relationship,
      blood_type: d.blood_type,
      allergies: d.allergies,
      medical_conditions: d.medical_conditions,
    }));
    const response = await apiClient.post('/auth/dependants/bulk', { dependants: payload });
    return response.data;
  },

  async getWalletBalance(): Promise<number> {
    const response = await apiClient.get('/auth/profile');
    return response.data.data?.wallet_balance || 0;
  },
};
