import { apiClient } from '../config/api';
import { CreateRequestPayload, RequestResponse } from '../types/request';

class RequestService {
  /**
   * Create a new service request (instant or scheduled)
   */
  async createRequest(payload: CreateRequestPayload): Promise<RequestResponse> {
    try {
      const response = await apiClient.post<RequestResponse>(
        '/patients/instant-requests',
        payload
      );
      return response.data;
    } catch (error: any) {
      console.error('Create request error:', error);
      throw error;
    }
  }

  /**
   * Get request by ID
   */
  async getRequestById(requestId: number): Promise<any> {
    try {
      const response = await apiClient.get(`/patients/requests/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('Get request error:', error);
      throw error;
    }
  }

  /**
   * Cancel a request
   */
  async cancelRequest(requestId: number): Promise<any> {
    try {
      const response = await apiClient.post(`/patients/requests/${requestId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Cancel request error:', error);
      throw error;
    }
  }

  /**
   * Get price estimate for a service - Now fetches from API
   */
  async getPriceEstimate(
    specialtyId: number,
    distance: number,
    isEmergency: boolean = false,
    specialtyFee?: number,
    emergencyFee?: number
  ): Promise<number> {
    // Use provided fees from specialty data if available
    if (specialtyFee) {
      return isEmergency ? (emergencyFee || specialtyFee * 1.5) : specialtyFee;
    }
    
    // Fallback: fetch specialty from API
    try {
      const response = await apiClient.get(`/medical-specialties/${specialtyId}`);
      if (response.data?.data) {
        const specialty = response.data.data;
        return isEmergency 
          ? (specialty.emergency_fee || specialty.consultation_fee * 1.5)
          : specialty.consultation_fee;
      }
    } catch (error) {
      console.error('Failed to fetch specialty pricing:', error);
    }
    
    // Final fallback
    return isEmergency ? 3000 : 1500;
  }
}

export default new RequestService();
