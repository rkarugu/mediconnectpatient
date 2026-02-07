// Service Request Types
export interface ServiceType {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  basePrice: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

export interface RequestFormData {
  specialty_id: number;
  medic_id?: number;
  location: LocationData;
  scheduled_time?: Date | null;
  is_emergency: boolean;
  notes: string;
  symptoms?: string;
  images?: string[];
}

export interface CreateRequestPayload {
  medic_id?: number;
  specialty_id: number;
  latitude: number;
  longitude: number;
  address: string;
  scheduled_time?: string;
  notes?: string;
  is_emergency?: boolean;
  estimated_price?: number;
  payment_method?: 'cash' | 'mpesa' | 'wallet' | 'insurance' | 'card';
}

export interface RequestResponse {
  success: boolean;
  data: {
    id: number;
    status: string;
    estimated_arrival?: string;
    medic?: any;
  };
  message?: string;
}
