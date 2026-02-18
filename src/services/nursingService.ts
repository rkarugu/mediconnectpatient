import { apiClient } from '../config/api';

export interface NursingServiceType {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  base_fee: number;
  emergency_fee: number;
  estimated_duration_minutes: number;
  is_active: boolean;
}

class NursingService {
  async getNursingServiceTypes(): Promise<NursingServiceType[]> {
    try {
      const response = await apiClient.get('/patients/nursing-service-types');
      return response.data.data;
    } catch (error) {
      console.error('Get nursing service types error:', error);
      throw error;
    }
  }

  async getNursingServiceType(id: number): Promise<NursingServiceType> {
    try {
      const response = await apiClient.get(`/patients/nursing-service-types/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Get nursing service type error:', error);
      throw error;
    }
  }
}

export default new NursingService();
