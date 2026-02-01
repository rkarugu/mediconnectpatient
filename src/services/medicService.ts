import { apiClient } from '../config/api';
import {
  NearbyMedicsRequest,
  NearbyMedicsResponse,
  Medic,
  MedicalSpecialty,
  ServiceRequest,
  ServiceRequestResponse,
} from '../types/medic';

class MedicService {
  /**
   * Get nearby available medics based on user location
   */
  async getNearbyMedics(params: NearbyMedicsRequest): Promise<Medic[]> {
    try {
      const response = await apiClient.get<NearbyMedicsResponse>('/patients/nearby-medics', {
        params: {
          latitude: params.latitude,
          longitude: params.longitude,
          radius: params.radius || 10,
          specialty_id: params.specialty_id,
          limit: params.limit || 20,
        },
      });

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to fetch nearby medics');
    } catch (error: any) {
      console.error('Get nearby medics error:', error);
      
      // Return mock data for development if API not ready
      if (error.response?.status === 404) {
        console.warn('API endpoint not ready, returning mock data');
        return this.getMockMedics(params);
      }
      
      throw error;
    }
  }

  /**
   * Get all medical specialties
   */
  async getMedicalSpecialties(): Promise<MedicalSpecialty[]> {
    try {
      const response = await apiClient.get('/medical-specialties');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Get medical specialties error:', error);
      return this.getMockSpecialties();
    }
  }

  /**
   * Create a service request (instant or scheduled)
   */
  async createServiceRequest(request: ServiceRequest): Promise<ServiceRequestResponse> {
    try {
      const response = await apiClient.post<ServiceRequestResponse>(
        '/patients/instant-requests',
        request
      );
      return response.data;
    } catch (error: any) {
      console.error('Create service request error:', error);
      throw error;
    }
  }

  /**
   * Get medic details by ID
   */
  async getMedicById(medicId: number): Promise<Medic> {
    try {
      const response = await apiClient.get(`/medical-workers/${medicId}`);
      return response.data.data;
    } catch (error) {
      console.error('Get medic by ID error:', error);
      throw error;
    }
  }

  /**
   * Mock data for development - Remove when backend is ready
   */
  private getMockMedics(params: NearbyMedicsRequest): Medic[] {
    const mockMedics: Medic[] = [
      {
        id: 1,
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@mediconnect.com',
        phone: '+254712345678',
        profile_picture: 'https://randomuser.me/api/portraits/women/1.jpg',
        medical_specialty_id: 1,
        specialty_name: 'General Practitioner',
        license_number: 'MD-12345',
        years_of_experience: 8,
        bio: 'Experienced GP specializing in family medicine',
        rating: 4.8,
        total_reviews: 127,
        is_available: true,
        latitude: params.latitude + 0.01,
        longitude: params.longitude + 0.01,
        distance: 1.2,
        status: 'available',
        hourly_rate: 2500,
      },
      {
        id: 2,
        name: 'Nurse Mary Wanjiku',
        email: 'mary.wanjiku@mediconnect.com',
        phone: '+254723456789',
        profile_picture: 'https://randomuser.me/api/portraits/women/2.jpg',
        medical_specialty_id: 2,
        specialty_name: 'Registered Nurse',
        license_number: 'RN-54321',
        years_of_experience: 5,
        bio: 'Certified nurse with home care experience',
        rating: 4.9,
        total_reviews: 89,
        is_available: true,
        latitude: params.latitude - 0.015,
        longitude: params.longitude + 0.02,
        distance: 2.1,
        status: 'available',
        hourly_rate: 1500,
      },
      {
        id: 3,
        name: 'John Kamau - Phlebotomist',
        email: 'john.kamau@mediconnect.com',
        phone: '+254734567890',
        profile_picture: 'https://randomuser.me/api/portraits/men/1.jpg',
        medical_specialty_id: 3,
        specialty_name: 'Phlebotomist',
        license_number: 'PH-98765',
        years_of_experience: 3,
        bio: 'Expert in blood sample collection',
        rating: 4.7,
        total_reviews: 56,
        is_available: true,
        latitude: params.latitude + 0.02,
        longitude: params.longitude - 0.01,
        distance: 1.8,
        status: 'available',
        hourly_rate: 1000,
      },
      {
        id: 4,
        name: 'Dr. James Omondi',
        email: 'james.omondi@mediconnect.com',
        phone: '+254745678901',
        profile_picture: 'https://randomuser.me/api/portraits/men/2.jpg',
        medical_specialty_id: 4,
        specialty_name: 'Physiotherapist',
        license_number: 'PT-11223',
        years_of_experience: 6,
        bio: 'Sports injury and rehabilitation specialist',
        rating: 4.6,
        total_reviews: 73,
        is_available: false,
        latitude: params.latitude - 0.025,
        longitude: params.longitude - 0.015,
        distance: 3.2,
        status: 'busy',
        hourly_rate: 2000,
      },
      {
        id: 5,
        name: 'Ambulance Service - Nairobi',
        email: 'ambulance@mediconnect.com',
        phone: '+254756789012',
        medical_specialty_id: 5,
        specialty_name: 'Ambulance Service',
        license_number: 'AMB-44556',
        years_of_experience: 10,
        bio: 'Emergency medical transport service',
        rating: 4.9,
        total_reviews: 234,
        is_available: true,
        latitude: params.latitude + 0.005,
        longitude: params.longitude + 0.008,
        distance: 0.7,
        status: 'available',
        hourly_rate: 5000,
      },
    ];

    // Filter by specialty if provided
    if (params.specialty_id) {
      return mockMedics.filter((m) => m.medical_specialty_id === params.specialty_id);
    }

    return mockMedics;
  }

  private getMockSpecialties(): MedicalSpecialty[] {
    return [
      { id: 1, name: 'General Practitioner', icon: 'medical', color: '#0284c7' },
      { id: 2, name: 'Registered Nurse', icon: 'fitness', color: '#059669' },
      { id: 3, name: 'Phlebotomist', icon: 'water', color: '#dc2626' },
      { id: 4, name: 'Physiotherapist', icon: 'body', color: '#7c3aed' },
      { id: 5, name: 'Ambulance Service', icon: 'car', color: '#ea580c' },
      { id: 6, name: 'Telemedicine Doctor', icon: 'videocam', color: '#2563eb' },
    ];
  }
}

export default new MedicService();
