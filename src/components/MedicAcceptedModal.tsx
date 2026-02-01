import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MedicData {
  request_id: number;
  medic_id: number;
  medic_name: string;
  medic_phone?: string;
  medic_email?: string;
  medic_photo?: string;
  specialty?: string;
  subspecialty?: string;
  years_of_experience?: string;
  rating?: number;
  estimated_arrival?: string;
}

interface MedicAcceptedModalProps {
  visible: boolean;
  data: MedicData | null;
  onClose: () => void;
  onViewRequest: () => void;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.210.19.13:8000/api';
const STORAGE_URL = API_BASE_URL.replace('/api', '/storage/');

export const MedicAcceptedModal: React.FC<MedicAcceptedModalProps> = ({
  visible,
  data,
  onClose,
  onViewRequest,
}) => {
  React.useEffect(() => {
    if (visible) {
      // Vibrate to alert user
      if (Platform.OS === 'android') {
        Vibration.vibrate([0, 500, 200, 500]);
      } else {
        Vibration.vibrate(500);
      }
    }
  }, [visible]);

  if (!data) return null;

  const handleCall = () => {
    if (data.medic_phone) {
      Linking.openURL(`tel:${data.medic_phone}`);
    }
  };

  const getMedicPhotoUrl = () => {
    if (!data.medic_photo) return null;
    if (data.medic_photo.startsWith('http')) return data.medic_photo;
    return `${STORAGE_URL}${data.medic_photo}`;
  };

  const photoUrl = getMedicPhotoUrl();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Success Header */}
          <View style={styles.successHeader}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            </View>
            <Text style={styles.successTitle}>Medic Accepted!</Text>
            <Text style={styles.successSubtitle}>
              A medical professional is on their way
            </Text>
          </View>

          {/* Medic Info Card */}
          <View style={styles.medicCard}>
            {/* Medic Photo */}
            <View style={styles.photoContainer}>
              {photoUrl ? (
                <Image
                  source={{ uri: photoUrl }}
                  style={styles.medicPhoto}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="person" size={40} color="#9CA3AF" />
                </View>
              )}
              {/* Online indicator */}
              <View style={styles.onlineIndicator} />
            </View>

            {/* Medic Details */}
            <View style={styles.medicDetails}>
              <Text style={styles.medicName}>{data.medic_name}</Text>
              
              {data.specialty && (
                <View style={styles.specialtyContainer}>
                  <Ionicons name="medical" size={14} color="#6366F1" />
                  <Text style={styles.specialtyText}>
                    {data.specialty}
                    {data.subspecialty ? ` - ${data.subspecialty}` : ''}
                  </Text>
                </View>
              )}

              {data.years_of_experience && (
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={14} color="#6B7280" />
                  <Text style={styles.infoText}>
                    {data.years_of_experience} years experience
                  </Text>
                </View>
              )}

              {data.rating !== undefined && data.rating > 0 && (
                <View style={styles.infoRow}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.infoText}>
                    {data.rating.toFixed(1)} rating
                  </Text>
                </View>
              )}

              {data.estimated_arrival && (
                <View style={styles.arrivalContainer}>
                  <Ionicons name="car-outline" size={16} color="#10B981" />
                  <Text style={styles.arrivalText}>
                    ETA: {data.estimated_arrival}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Contact Info */}
          {data.medic_phone && (
            <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
              <Ionicons name="call-outline" size={20} color="#6366F1" />
              <Text style={styles.contactText}>{data.medic_phone}</Text>
              <Text style={styles.tapToCall}>Tap to call</Text>
            </TouchableOpacity>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.viewRequestButton}
              onPress={() => {
                onClose();
                onViewRequest();
              }}
            >
              <Ionicons name="eye-outline" size={20} color="#fff" />
              <Text style={styles.viewRequestText}>View Request</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 380,
    overflow: 'hidden',
  },
  successHeader: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
  },
  successIconContainer: {
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#047857',
  },
  medicCard: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  photoContainer: {
    position: 'relative',
    marginRight: 16,
  },
  medicPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#6366F1',
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E5E7EB',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#fff',
  },
  medicDetails: {
    flex: 1,
  },
  medicName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  specialtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  specialtyText: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '600',
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
  },
  arrivalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  arrivalText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
  },
  contactText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  tapToCall: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
  },
  actions: {
    padding: 20,
    paddingTop: 4,
    gap: 12,
  },
  viewRequestButton: {
    flexDirection: 'row',
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewRequestText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  closeButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
  },
});

export default MedicAcceptedModal;
