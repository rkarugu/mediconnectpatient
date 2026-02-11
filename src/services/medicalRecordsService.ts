import { apiClient } from '../config/api';

export interface MedicalRecord {
  id: number;
  record_type: string;
  record_type_label: string;
  title: string;
  description: string | null;
  file_name: string;
  mime_type: string;
  file_size: number;
  formatted_file_size: string;
  record_date: string | null;
  provider_name: string | null;
  notes: string | null;
  share_with_medics: boolean;
  created_at: string;
  file_url: string | null;
}

export interface RecordType {
  value: string;
  label: string;
  icon: string;
  description: string;
}

export interface CreateRecordPayload {
  record_type: string;
  title: string;
  description?: string;
  file: {
    uri: string;
    name: string;
    type: string;
  };
  record_date?: string;
  provider_name?: string;
  notes?: string;
  share_with_medics?: boolean;
}

export interface UpdateRecordPayload {
  record_type?: string;
  title?: string;
  description?: string;
  record_date?: string;
  provider_name?: string;
  notes?: string;
  share_with_medics?: boolean;
}

// Unified medical history types
export interface MedicalHistoryItem {
  id: string;
  source_type: 'prescription' | 'lab_result' | 'consultation_note' | 'upload';
  source_id: number;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  date: string;
  date_formatted: string;
  badge?: string | null;
  details: PrescriptionDetails | LabResultDetails | ConsultationNoteDetails | UploadDetails;
}

export interface PrescriptionDetails {
  diagnosis: string | null;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }> | null;
  instructions: string | null;
  notes: string | null;
  medic_name: string;
  specialty: string | null;
  service_request_id: number;
  issued_at: string;
  pdf_url: string | null;
}

export interface LabResultDetails {
  lab_facility: string | null;
  ordered_by: string;
  clinical_notes: string | null;
  is_urgent: boolean;
  status: string;
  completed_at: string | null;
  tests: Array<{
    name: string;
    code: string | null;
    category: string | null;
  }>;
  results: Array<{
    parameter_name: string;
    result_value: string;
    unit: string | null;
    reference_range: string | null;
    flag: string | null;
    comments: string | null;
    test_name: string | null;
  }>;
  has_critical: boolean;
  has_abnormal: boolean;
}

export interface ConsultationNoteDetails {
  medic_name: string;
  specialty: string | null;
  service_type: string | null;
  is_emergency: boolean;
  chief_complaint: string | null;
  history_of_present_illness: string | null;
  past_medical_history: string | null;
  current_medications: string | null;
  allergies: string | null;
  family_history: string | null;
  social_history: string | null;
  vital_signs: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    respiratoryRate?: string;
    oxygenSaturation?: string;
  } | null;
  physical_examination: string | null;
  clinical_notes: string | null;
  diagnosis: string | null;
  treatment_plan: string | null;
  follow_up_instructions: string | null;
  completed_at: string | null;
}

export interface UploadDetails {
  record_type: string;
  record_type_label: string;
  description: string | null;
  file_name: string;
  mime_type: string;
  file_size: number;
  formatted_file_size: string;
  provider_name: string | null;
  notes: string | null;
  share_with_medics: boolean;
  file_url: string | null;
}

export interface MedicalHistorySummary {
  total: number;
  prescriptions: number;
  lab_results: number;
  consultation_notes: number;
  uploads: number;
}

class MedicalRecordsService {
  /**
   * Get unified medical history (prescriptions + lab results + uploads)
   */
  async getMedicalHistory(filter?: string): Promise<{ history: MedicalHistoryItem[]; summary: MedicalHistorySummary }> {
    try {
      const params = filter && filter !== 'all' ? { type: filter } : {};
      const response = await apiClient.get('/patients/medical-history', { params });
      return {
        history: response.data.history || [],
        summary: response.data.summary || { total: 0, prescriptions: 0, lab_results: 0, consultation_notes: 0, uploads: 0 },
      };
    } catch (error: any) {
      console.error('Get medical history error:', error);
      throw error;
    }
  }

  /**
   * Get all medical records, optionally filtered by type
   */
  async getRecords(type?: string): Promise<MedicalRecord[]> {
    try {
      const params = type && type !== 'all' ? { type } : {};
      const response = await apiClient.get('/patients/medical-records', { params });
      return response.data.records || [];
    } catch (error: any) {
      console.error('Get medical records error:', error);
      throw error;
    }
  }

  /**
   * Get a single medical record by ID
   */
  async getRecord(id: number): Promise<MedicalRecord> {
    try {
      const response = await apiClient.get(`/patients/medical-records/${id}`);
      return response.data.record;
    } catch (error: any) {
      console.error('Get medical record error:', error);
      throw error;
    }
  }

  /**
   * Upload a new medical record
   */
  async uploadRecord(payload: CreateRecordPayload): Promise<MedicalRecord> {
    try {
      const formData = new FormData();
      formData.append('record_type', payload.record_type);
      formData.append('title', payload.title);
      if (payload.description) formData.append('description', payload.description);
      if (payload.record_date) formData.append('record_date', payload.record_date);
      if (payload.provider_name) formData.append('provider_name', payload.provider_name);
      if (payload.notes) formData.append('notes', payload.notes);
      formData.append('share_with_medics', payload.share_with_medics !== false ? '1' : '0');

      // Append file
      formData.append('file', {
        uri: payload.file.uri,
        name: payload.file.name,
        type: payload.file.type,
      } as any);

      const response = await apiClient.post('/patients/medical-records', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30s for uploads
      });

      return response.data.record;
    } catch (error: any) {
      console.error('Upload medical record error:', error);
      throw error;
    }
  }

  /**
   * Update a medical record's metadata
   */
  async updateRecord(id: number, payload: UpdateRecordPayload): Promise<MedicalRecord> {
    try {
      const response = await apiClient.put(`/patients/medical-records/${id}`, payload);
      return response.data.record;
    } catch (error: any) {
      console.error('Update medical record error:', error);
      throw error;
    }
  }

  /**
   * Delete a medical record
   */
  async deleteRecord(id: number): Promise<void> {
    try {
      await apiClient.delete(`/patients/medical-records/${id}`);
    } catch (error: any) {
      console.error('Delete medical record error:', error);
      throw error;
    }
  }

  /**
   * Get available record types
   */
  async getRecordTypes(): Promise<RecordType[]> {
    try {
      const response = await apiClient.get('/patients/medical-records/types');
      return response.data.record_types || [];
    } catch (error: any) {
      console.error('Get record types error:', error);
      throw error;
    }
  }
}

export default new MedicalRecordsService();
