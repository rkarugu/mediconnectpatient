import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { requestHistoryService } from '../services/requestHistoryService';

const COLORS = {
  primary: '#2B7BB9',
  secondary: '#2ECC71',
  error: '#E74C3C',
  white: '#FFFFFF',
  background: '#F5F8FA',
  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  border: '#E0E6ED',
};

interface ServiceDetails {
  id: number;
  medic_name: string;
  specialty: string;
  amount: number;
  status: string;
  completed_at: string;
}

export default function PaymentScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { requestId } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card'>('mpesa');

  useEffect(() => {
    loadServiceDetails();
  }, []);

  const loadServiceDetails = async () => {
    try {
      const details = await requestHistoryService.getRequestDetails(requestId);
      setServiceDetails({
        id: details.id,
        medic_name: details.medic?.name || 'Medical Professional',
        specialty: details.specialty || 'General',
        amount: details.amount || 500, // Default amount if not set
        status: details.status,
        completed_at: details.completed_at,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  const validatePhoneNumber = (phone: string) => {
    // Kenyan phone number validation
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 9 && cleaned.length <= 12;
  };

  const handleMpesaPayment = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert('Invalid Phone', 'Please enter a valid M-Pesa phone number');
      return;
    }

    setProcessing(true);
    try {
      // Format phone number for M-Pesa
      let formattedPhone = phoneNumber.replace(/\D/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('254')) {
        formattedPhone = '254' + formattedPhone;
      }

      await requestHistoryService.initiatePayment(requestId, {
        phone_number: formattedPhone,
        amount: serviceDetails?.amount || 500,
        payment_method: 'mpesa',
      });

      Alert.alert(
        'STK Push Sent',
        'Please check your phone and enter your M-Pesa PIN to complete the payment.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to review screen after payment
              navigation.replace('Review', { requestId });
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Payment Failed', error.message || 'Failed to initiate payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleSkipPayment = () => {
    Alert.alert(
      'Skip Payment',
      'Are you sure you want to skip payment for now? You can pay later from your history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: () => navigation.replace('Review', { requestId }),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading payment details...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 20 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Service Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons name="medical" size={24} color={COLORS.primary} />
          <Text style={styles.summaryTitle}>Service Completed</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Medical Professional</Text>
          <Text style={styles.summaryValue}>{serviceDetails?.medic_name}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Specialty</Text>
          <Text style={styles.summaryValue}>{serviceDetails?.specialty}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>KES {serviceDetails?.amount?.toLocaleString()}</Text>
        </View>
      </View>

      {/* Payment Method Selection */}
      <Text style={styles.sectionTitle}>Select Payment Method</Text>
      <View style={styles.methodsContainer}>
        <TouchableOpacity
          style={[styles.methodCard, paymentMethod === 'mpesa' && styles.methodCardActive]}
          onPress={() => setPaymentMethod('mpesa')}
        >
          <View style={[styles.methodIcon, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.methodIconText}>M</Text>
          </View>
          <Text style={styles.methodName}>M-Pesa</Text>
          {paymentMethod === 'mpesa' && (
            <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} style={styles.checkIcon} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.methodCard, paymentMethod === 'card' && styles.methodCardActive, styles.methodDisabled]}
          disabled
        >
          <View style={[styles.methodIcon, { backgroundColor: '#9E9E9E' }]}>
            <Ionicons name="card" size={20} color={COLORS.white} />
          </View>
          <Text style={[styles.methodName, { color: COLORS.textSecondary }]}>Card</Text>
          <Text style={styles.comingSoon}>Coming Soon</Text>
        </TouchableOpacity>
      </View>

      {/* M-Pesa Phone Input */}
      {paymentMethod === 'mpesa' && (
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>M-Pesa Phone Number</Text>
          <View style={styles.phoneInputContainer}>
            <Text style={styles.phonePrefix}>+254</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="7XX XXX XXX"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={12}
            />
          </View>
          <Text style={styles.inputHint}>
            You will receive an STK push to complete the payment
          </Text>
        </View>
      )}

      {/* Pay Button */}
      <TouchableOpacity
        style={[styles.payButton, processing && styles.buttonDisabled]}
        onPress={handleMpesaPayment}
        disabled={processing}
      >
        {processing ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            <Ionicons name="shield-checkmark" size={24} color={COLORS.white} />
            <Text style={styles.payButtonText}>Pay KES {serviceDetails?.amount?.toLocaleString()}</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkipPayment}>
        <Text style={styles.skipButtonText}>Pay Later</Text>
      </TouchableOpacity>

      {/* Security Note */}
      <View style={styles.securityNote}>
        <Ionicons name="lock-closed" size={16} color={COLORS.textSecondary} />
        <Text style={styles.securityText}>
          Your payment is secured with end-to-end encryption
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  methodsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  methodCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodCardActive: {
    borderColor: COLORS.primary,
  },
  methodDisabled: {
    opacity: 0.6,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  methodIconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  methodName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  comingSoon: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  inputSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  phonePrefix: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  inputHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  securityText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
