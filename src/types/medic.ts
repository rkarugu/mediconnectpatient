// Medic and Service Types
export interface MedicalSpecialty {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  consultation_fee: number;
  emergency_fee: number;
}

export interface Medic {
  id: number;
  name: string;
  email: string;
  phone?: string;
  profile_picture?: string;
  medical_specialty_id: number;
  specialty?: MedicalSpecialty;
  specialty_name?: string;
  license_number?: string;
  years_of_experience?: number;
  bio?: string;
  rating?: number;
  total_reviews?: number;
  is_available: boolean;
  latitude?: number;
  longitude?: number;
  distance?: number; // Distance from user in km
  status?: 'available' | 'busy' | 'offline';
  hourly_rate?: number;
}

export interface NearbyMedicsRequest {
  latitude: number;
  longitude: number;
  radius?: number; // in kilometers, default 10
  specialty_id?: number;
  limit?: number;
}

export interface NearbyMedicsResponse {
  success: boolean;
  data: Medic[];
  message?: string;
}

export interface ServiceRequest {
  medic_id?: number;
  specialty_id: number;
  latitude: number;
  longitude: number;
  address: string;
  scheduled_time?: string; // ISO string for scheduled, null for instant
  notes?: string;
  is_emergency?: boolean;
  estimated_price?: number;
}

export interface ServiceRequestResponse {
  success: boolean;
  data: {
    id: number;
    status: string;
    estimated_arrival?: string;
  };
  message?: string;
}
