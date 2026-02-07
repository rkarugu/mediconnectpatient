import { apiClient } from '../config/api';

export interface RequestHistoryItem {
  id: number;
  status: string;
  service_type: string;
  is_emergency: boolean;
  medic_name: string;
  medic_profile_picture?: string | null;
  medic_subspecialty?: string | null;
  medic_years_of_experience?: number | null;
  medic_latitude?: number | null;
  medic_longitude?: number | null;
  medic_distance_km?: number | null;
  specialty: string;
  address: string;
  scheduled_time?: string;
  created_at: string;
}

class RequestHistoryService {
  /**
   * Get all patient's service requests
   */
  async getMyRequests(status?: string): Promise<RequestHistoryItem[]> {
    try {
      const params = status ? { status } : {};
      const response = await apiClient.get('/patients/requests', { params });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      return [];
    } catch (error) {
      console.error('Get my requests error:', error);
      return [];
    }
  }

  /**
   * Get request details by ID
   */
  async getRequestDetails(requestId: number): Promise<any> {
    try {
      const response = await apiClient.get(`/patients/requests/${requestId}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error('Request not found');
    } catch (error: any) {
      // Don't log 404 errors - they're expected when requests don't belong to this patient
      // This happens when socket broadcasts requests from other patients
      if (error?.response?.status !== 404) {
        console.error('Get request details error:', error);
      }
      throw error;
    }
  }

  /**
   * Cancel a service request
   */
  async cancelRequest(requestId: number): Promise<boolean> {
    try {
      const response = await apiClient.post(`/patients/requests/${requestId}/cancel`);
      return response.data.success;
    } catch (error) {
      console.error('Cancel request error:', error);
      throw error;
    }
  }

  /**
   * Get medic's current location for tracking
   */
  async getMedicLocation(requestId: number): Promise<any> {
    try {
      const response = await apiClient.get(`/patients/requests/${requestId}/medic-location`);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error('Failed to get medic location');
    } catch (error) {
      console.error('Get medic location error:', error);
      throw error;
    }
  }

  /**
   * Initiate payment for a service request
   */
  async initiatePayment(requestId: number, paymentData: {
    payment_method: string;
    phone_number?: string;
    amount?: number;
  }): Promise<any> {
    try {
      // Only include phone_number if payment_method is mpesa
      const payload: any = {
        payment_method: paymentData.payment_method,
      };
      if (paymentData.payment_method === 'mpesa' && paymentData.phone_number) {
        payload.phone_number = paymentData.phone_number;
      }
      if (paymentData.amount !== undefined) {
        payload.amount = paymentData.amount;
      }

      const response = await apiClient.post(`/patients/requests/${requestId}/pay`, payload);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Payment failed');
    } catch (error: any) {
      console.error('Initiate payment error:', error);
      throw new Error(error.response?.data?.message || 'Payment failed');
    }
  }

  /**
   * Submit a review for a completed service
   */
  async submitReview(requestId: number, reviewData: {
    rating: number;
    review: string;
  }): Promise<any> {
    try {
      const response = await apiClient.post(`/patients/requests/${requestId}/review`, reviewData);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to submit review');
    } catch (error: any) {
      console.error('Submit review error:', error);
      throw new Error(error.response?.data?.message || 'Failed to submit review');
    }
  }
}

export const requestHistoryService = new RequestHistoryService();
export default requestHistoryService;
