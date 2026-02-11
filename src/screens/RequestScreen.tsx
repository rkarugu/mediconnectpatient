import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { Button, Input, LoadingSpinner, Card } from '../components';
import ServiceTypeCard from '../components/ServiceTypeCard';
import PaymentOptionsModal, { PaymentMethod } from '../components/PaymentOptionsModal';
import medicService from '../services/medicService';
import requestService from '../services/requestService';
import { MedicalSpecialty, Medic } from '../types/medic';
import { RequestFormData, LocationData } from '../types/request';
import useRealtimeRefresh from '../hooks/useRealtimeRefresh';

interface RequestScreenProps {
  navigation: any;
  route: any;
}

export default function RequestScreen({ navigation, route }: RequestScreenProps) {
  const { medic, location: initialLocation, specialty: initialSpecialty } = route.params || {};

  const [step, setStep] = useState(1);
  const [specialties, setSpecialties] = useState<MedicalSpecialty[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<number | null>(initialSpecialty || null);
  const [selectedMedic, setSelectedMedic] = useState<Medic | null>(medic || null);
  const [location, setLocation] = useState<LocationData>({
    latitude: initialLocation?.latitude || -1.286389,
    longitude: initialLocation?.longitude || 36.817223,
    address: '',
  });
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [walletBalance, setWalletBalance] = useState(5000); // TODO: Fetch actual wallet balance

  useEffect(() => {
    loadSpecialties();
  }, [loadSpecialties]);

  useEffect(() => {
    if (selectedSpecialty) {
      calculatePrice();
    }
  }, [selectedSpecialty, isEmergency]);

  const loadSpecialties = useCallback(async () => {
    try {
      const data = await medicService.getMedicalSpecialties();
      setSpecialties(data);
    } catch (error) {
      console.error('Load specialties error:', error);
    }
  }, []);

  useRealtimeRefresh(loadSpecialties, {
    events: ['service_request.accepted', 'medic.assigned'],
    intervalMs: 30000,
    enabled: true,
  });

  const calculatePrice = () => {
    if (!selectedSpecialty) return;
    const specialty = specialties.find(s => s.id === selectedSpecialty);
    if (specialty) {
      const price = isEmergency 
        ? (specialty.emergency_fee || specialty.consultation_fee * 1.5)
        : specialty.consultation_fee;
      setEstimatedPrice(price);
    }
  };

  const handleSubmitRequest = async () => {
    if (!selectedSpecialty) {
      Alert.alert('Error', 'Please select a service type');
      return;
    }

    if (!location.address) {
      Alert.alert('Error', 'Please confirm your location');
      return;
    }

    // Show payment selection modal
    setShowPaymentModal(true);
  };

  const handlePaymentMethodSelected = async (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    setShowPaymentModal(false);

    // If insurance selected, verify coverage first
    if (method === 'insurance') {
      // TODO: Implement insurance verification API call
      Alert.alert('Insurance Verification', 'Verifying your insurance coverage...');
    }

    setLoading(true);
    try {
      if (!selectedSpecialty) {
        throw new Error('No specialty selected');
      }
      
      const payload = {
        specialty_id: selectedSpecialty,
        medic_id: selectedMedic?.id,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || 'Current Location',
        scheduled_time: scheduledTime?.toISOString(),
        notes: notes,
        is_emergency: isEmergency,
        estimated_price: getSelectedSpecialtyFee(),
        payment_method: method,
      };

      const response = await requestService.createRequest(payload);

      if (response.success) {
        Alert.alert(
          'Success',
          'Your request has been submitted successfully!',
          [
            {
              text: 'Track Request',
              onPress: () => navigation.navigate('Tracking', { requestId: response.data.id }),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to submit request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((s) => (
        <View key={s} style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              step >= s && styles.stepCircleActive,
            ]}
          >
            <Text
              style={[
                styles.stepNumber,
                step >= s && styles.stepNumberActive,
              ]}
            >
              {s}
            </Text>
          </View>
          {s < 3 && (
            <View
              style={[
                styles.stepLine,
                step > s && styles.stepLineActive,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const getSpecialtyIcon = (name: string): 'medical' | 'fitness' | 'water' | 'body' | 'car' | 'medkit' => {
    const lower = name.toLowerCase();
    if (lower.includes('nurse')) return 'fitness';
    if (lower.includes('blood') || lower.includes('phlebotom')) return 'water';
    if (lower.includes('physio')) return 'body';
    if (lower.includes('ambulance')) return 'car';
    return 'medkit';
  };

  const getSpecialtyColor = (index: number): string => {
    const colors = [COLORS.primary, COLORS.success, COLORS.error, COLORS.secondary, COLORS.warning];
    return colors[index % colors.length];
  };

  const getSelectedSpecialtyFee = (): number => {
    const specialty = specialties.find(s => s.id === selectedSpecialty);
    if (!specialty) return 0;
    return isEmergency 
      ? (specialty.emergency_fee || specialty.consultation_fee * 1.5) 
      : specialty.consultation_fee;
  };

  const renderServiceSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Service Type</Text>
      <Text style={styles.stepSubtitle}>Choose the medical service you need</Text>

      <ScrollView
        style={styles.serviceList}
        showsVerticalScrollIndicator={false}
      >
        {specialties.map((specialty, index) => (
          <ServiceTypeCard
            key={specialty.id}
            id={specialty.id}
            name={specialty.name}
            description={specialty.description || `${specialty.name} consultation and treatment`}
            icon={getSpecialtyIcon(specialty.name)}
            color={getSpecialtyColor(index)}
            basePrice={specialty.consultation_fee || 1500}
            selected={selectedSpecialty === specialty.id}
            onPress={() => {
              setSelectedSpecialty(specialty.id);
              setEstimatedPrice(isEmergency 
                ? (specialty.emergency_fee || specialty.consultation_fee * 1.5)
                : specialty.consultation_fee);
            }}
          />
        ))}
      </ScrollView>

      <Button
        title="Continue"
        onPress={() => setStep(2)}
        disabled={!selectedSpecialty}
        fullWidth
      />
    </View>
  );

  const renderLocationConfirmation = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Confirm Location</Text>
      <Text style={styles.stepSubtitle}>Where do you need the service?</Text>

      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onPress={(e) =>
            setLocation({
              ...location,
              latitude: e.nativeEvent.coordinate.latitude,
              longitude: e.nativeEvent.coordinate.longitude,
            })
          }
        >
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            draggable
            onDragEnd={(e) =>
              setLocation({
                ...location,
                latitude: e.nativeEvent.coordinate.latitude,
                longitude: e.nativeEvent.coordinate.longitude,
              })
            }
          >
            <View style={styles.customMarker}>
              <Ionicons name="location" size={40} color={COLORS.error} />
            </View>
          </Marker>
        </MapView>
      </View>

      <Input
        label="Address"
        placeholder="Enter your address"
        value={location.address}
        onChangeText={(text) => setLocation({ ...location, address: text })}
        leftIcon="location-outline"
      />

      <View style={styles.buttonRow}>
        <Button
          title="Back"
          onPress={() => setStep(1)}
          variant="outline"
          style={styles.halfButton}
        />
        <Button
          title="Continue"
          onPress={() => setStep(3)}
          disabled={!location.address}
          style={styles.halfButton}
        />
      </View>
    </View>
  );

  const renderScheduling = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Schedule Service</Text>
      <Text style={styles.stepSubtitle}>When do you need the service?</Text>

      <Card style={styles.schedulingCard}>
        <TouchableOpacity
          style={styles.scheduleOption}
          onPress={() => setScheduledTime(null)}
        >
          <View style={styles.radioButton}>
            {!scheduledTime && <View style={styles.radioButtonInner} />}
          </View>
          <View style={styles.scheduleOptionContent}>
            <Text style={styles.scheduleOptionTitle}>Book Now</Text>
            <Text style={styles.scheduleOptionSubtitle}>
              Get immediate medical assistance
            </Text>
          </View>
          <Ionicons name="flash" size={24} color={COLORS.warning} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.scheduleOption}
          onPress={() => {
            setScheduledTime(new Date());
            setShowDatePicker(true);
          }}
        >
          <View style={styles.radioButton}>
            {scheduledTime && <View style={styles.radioButtonInner} />}
          </View>
          <View style={styles.scheduleOptionContent}>
            <Text style={styles.scheduleOptionTitle}>Schedule Later</Text>
            <Text style={styles.scheduleOptionSubtitle}>
              {scheduledTime
                ? scheduledTime.toLocaleString()
                : 'Choose date and time'}
            </Text>
          </View>
          <Ionicons name="calendar" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </Card>

      {showDatePicker && (
        <DateTimePicker
          value={scheduledTime || new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              setScheduledTime(date);
              setShowTimePicker(true);
            }
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={scheduledTime || new Date()}
          mode="time"
          display="default"
          onChange={(event, date) => {
            setShowTimePicker(false);
            if (date) {
              setScheduledTime(date);
            }
          }}
        />
      )}

      <View style={styles.emergencyToggle}>
        <View>
          <Text style={styles.emergencyTitle}>Emergency Service</Text>
          <Text style={styles.emergencySubtitle}>
            Priority response (1.5x price)
          </Text>
        </View>
        <Switch
          value={isEmergency}
          onValueChange={setIsEmergency}
          trackColor={{ false: COLORS.border, true: COLORS.error }}
          thumbColor={COLORS.white}
        />
      </View>

      <Input
        label="Additional Notes (Optional)"
        placeholder="Describe your symptoms or special requirements"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={4}
        style={{ height: 100 }}
      />

      <Card style={styles.priceCard}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Estimated Price:</Text>
          <Text style={styles.priceValue}>KES {estimatedPrice.toLocaleString()}</Text>
        </View>
        <Text style={styles.priceNote}>
          Final price may vary based on actual distance and service duration
        </Text>
      </Card>

      <View style={styles.buttonRow}>
        <Button
          title="Back"
          onPress={() => setStep(2)}
          variant="outline"
          style={styles.halfButton}
        />
        <Button
          title="Submit Request"
          onPress={handleSubmitRequest}
          loading={loading}
          style={styles.halfButton}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request a Medic</Text>
        <View style={{ width: 40 }} />
      </View>

      {renderStepIndicator()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && renderServiceSelection()}
        {step === 2 && renderLocationConfirmation()}
        {step === 3 && renderScheduling()}
      </ScrollView>

      <PaymentOptionsModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSelectPayment={handlePaymentMethodSelected}
        estimatedPrice={estimatedPrice}
        walletBalance={walletBalance}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: SPACING.base,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
  },
  stepNumber: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textSecondary,
  },
  stepNumberActive: {
    color: COLORS.white,
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.xs,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.base,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  stepSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  serviceList: {
    flex: 1,
    marginBottom: SPACING.base,
  },
  mapContainer: {
    height: 250,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.base,
    ...SHADOWS.md,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.base,
  },
  halfButton: {
    flex: 1,
  },
  schedulingCard: {
    marginBottom: SPACING.base,
  },
  scheduleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  scheduleOptionContent: {
    flex: 1,
  },
  scheduleOptionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
  },
  scheduleOptionSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xs,
  },
  emergencyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.base,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.base,
  },
  emergencyTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  emergencySubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs / 2,
  },
  priceCard: {
    backgroundColor: COLORS.primaryLight + '10',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    marginBottom: SPACING.base,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  priceLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  priceValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  priceNote: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});
