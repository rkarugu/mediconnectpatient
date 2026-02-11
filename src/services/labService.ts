import { apiClient } from '../config/api';

export interface LabTest {
  id: number;
  name: string;
  code: string;
  category: string;
}

export interface LabFacility {
  id: number;
  name: string;
  address: string;
  phone?: string;
}

export interface LabRequestSummary {
  id: number;
  status: string;
  is_urgent: boolean;
  created_at: string;
  completed_at: string | null;
  lab_facility: LabFacility | null;
  medic_name: string;
  tests: LabTest[];
  test_count: number;
}

export interface LabResult {
  id: number;
  parameter_name: string;
  result_value: string;
  unit: string | null;
  reference_range: string | null;
  flag: 'normal' | 'low' | 'high' | 'critical' | 'abnormal';
  comments: string | null;
  entered_at: string | null;
  verified_at: string | null;
}

export interface LabTestWithResults {
  id: number;
  test_type_id: number;
  name: string;
  code: string;
  category: string;
  description: string;
  price: number;
  has_results: boolean;
  results: LabResult[];
}

export interface LabRequestDetail {
  id: number;
  status: string;
  payment_status: string;
  payment_method: string;
  is_urgent: boolean;
  clinical_notes: string | null;
  created_at: string;
  sample_collected_at: string | null;
  processing_started_at: string | null;
  completed_at: string | null;
  lab_facility: LabFacility | null;
  medic_name: string;
  tests: LabTestWithResults[];
  has_critical: boolean;
  collection_fee: number;
  total_amount: number;
}

export interface PendingLabRequest {
  id: number;
  status: string;
  payment_status: string;
  payment_method: string;
  is_urgent: boolean;
  created_at: string;
  lab_facility: LabFacility | null;
  medic_name: string;
  tests: Array<{
    id: number;
    name: string;
    code: string;
    category: string;
    price: number;
  }>;
  collection_fee: number;
  total_amount: number;
  clinical_notes: string | null;
}

class LabService {
  /**
   * Get all lab requests for the patient
   */
  async getLabRequests(): Promise<LabRequestSummary[]> {
    try {
      const response = await apiClient.get('/patient/lab/requests');
      return response.data.requests || [];
    } catch (error: any) {
      console.error('Get lab requests error:', error);
      throw error;
    }
  }

  /**
   * Get pending lab requests that need confirmation/payment
   */
  async getPendingLabRequests(): Promise<PendingLabRequest[]> {
    try {
      const response = await apiClient.get('/patient/lab/requests/pending');
      return response.data.pending_requests || [];
    } catch (error: any) {
      console.error('Get pending lab requests error:', error);
      throw error;
    }
  }

  /**
   * Get a specific lab request with full results
   */
  async getLabRequest(requestId: number): Promise<LabRequestDetail> {
    try {
      const response = await apiClient.get(`/patient/lab/requests/${requestId}`);
      return response.data.lab_request;
    } catch (error: any) {
      console.error('Get lab request error:', error);
      throw error;
    }
  }

  /**
   * Confirm and pay for a lab request
   */
  async confirmAndPay(requestId: number, paymentMethod: string, paymentReference?: string): Promise<any> {
    try {
      const response = await apiClient.post(`/patient/lab/requests/${requestId}/confirm`, {
        payment_method: paymentMethod,
        payment_reference: paymentReference,
      });
      return response.data;
    } catch (error: any) {
      console.error('Confirm lab request error:', error);
      throw error;
    }
  }

  /**
   * Decline a lab request
   */
  async declineRequest(requestId: number, reason?: string): Promise<any> {
    try {
      const response = await apiClient.post(`/patient/lab/requests/${requestId}/decline`, {
        reason,
      });
      return response.data;
    } catch (error: any) {
      console.error('Decline lab request error:', error);
      throw error;
    }
  }
}

export default new LabService();
