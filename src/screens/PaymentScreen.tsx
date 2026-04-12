import React, { useState, useEffect, useCallback } from 'react';
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
import useRealtimeRefresh from '../hooks/useRealtimeRefresh';

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
  payment_method: string;
}

export default function PaymentScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { requestId } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'wallet'>('mpesa');

  const loadServiceDetails = useCallback(async () => {
    try {
      const details = await requestHistoryService.getRequestDetails(requestId);
      const preSelectedMethod = details.payment_method || 'mpesa';
      
      setServiceDetails({
        id: details.id,
        medic_name: details.medic?.name || 'Medical Professional',
        specialty: details.specialty || 'General',
        amount: details.amount || 500,
        status: details.status,
        completed_at: details.completed_at,
        payment_method: preSelectedMethod,
      });
      
      // Set payment method from service request (pre-selected at booking)
      if (preSelectedMethod === 'wallet' || preSelectedMethod === 'mpesa') {
        setPaymentMethod(preSelectedMethod as 'mpesa' | 'wallet');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load service details');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadServiceDetails();
  }, [loadServiceDetails]);

  useRealtimeRefresh(loadServiceDetails, {
    events: ['payment.processed', 'service.completed'],
    intervalMs: 30000,
    enabled: true,
  });

  const validatePhoneNumber = (phone: string) => {
    // Kenyan phone number validation
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 9 && cleaned.length <= 12;
  };

  const [awaitingMpesa, setAwaitingMpesa] = useState(false);
  const [mpesaMessage, setMpesaMessage] = useState('');

  const pollPaymentStatus = useCallback(async (paymentId: number, maxAttempts = 20) => {
    let attempts = 0;
    const poll = async (): Promise<boolean> => {
      attempts++;
      try {
        const details = await requestHistoryService.getRequestDetails(requestId);
        const paymentStatus = details.payment_status;
        
        if (paymentStatus === 'paid') {
          setMpesaMessage('Payment confirmed!');
          setTimeout(() => {
            Alert.alert(
              'Payment Successful',
              'Your payment has been confirmed. The medic will now proceed with treatment.',
              [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate('Tracking', { requestId }),
                },
              ]
            );
          }, 1000);
          return true;
        } else if (paymentStatus === 'failed') {
          setAwaitingMpesa(false);
          setProcessing(false);
          Alert.alert('Payment Failed', 'The M-Pesa payment was not completed. Please try again.');
          return true;
        }
      } catch (e) {
        console.log('Poll error:', e);
      }

      if (attempts >= maxAttempts) {
        setAwaitingMpesa(false);
        setProcessing(false);
        Alert.alert(
          'Payment Pending',
          'We haven\'t received confirmation yet. If you completed the payment, it will be updated shortly. You can check the status in your tracking screen.',
          [
            { text: 'Try Again', style: 'cancel' },
            { text: 'Go to Tracking', onPress: () => navigation.navigate('Tracking', { requestId }) },
          ]
        );
        return true;
      }

      // Wait 3 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 3000));
      return poll();
    };

    return poll();
  }, [requestId, navigation]);

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

      const result = await requestHistoryService.initiatePayment(requestId, {
        phone_number: formattedPhone,
        amount: serviceDetails?.amount || 500,
        payment_method: 'mpesa',
      });

      // STK Push was sent successfully — show waiting UI
      setAwaitingMpesa(true);
      setMpesaMessage('STK Push sent! Enter your M-Pesa PIN on your phone...');

      // Start polling for payment confirmation
      if (result?.payment_id) {
        pollPaymentStatus(result.payment_id);
      } else {
        pollPaymentStatus(0);
      }
    } catch (error: any) {
      setProcessing(false);
      Alert.alert('Payment Failed', error.message || 'Failed to initiate M-Pesa payment. Please try again.');
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

  if (awaitingMpesa) {
    return (
      <View style={[styles.container, styles.centered, { paddingHorizontal: 32 }]}>
        <View style={styles.mpesaWaitingCard}>
          <View style={[styles.methodIcon, { backgroundColor: '#4CAF50', width: 72, height: 72, borderRadius: 36, marginBottom: 20 }]}>
            <Text style={[styles.methodIconText, { fontSize: 36 }]}>M</Text>
          </View>
          <ActivityIndicator size="large" color="#4CAF50" style={{ marginBottom: 16 }} />
          <Text style={styles.mpesaWaitingTitle}>M-Pesa Payment</Text>
          <Text style={styles.mpesaWaitingMessage}>{mpesaMessage}</Text>
          <Text style={styles.mpesaWaitingHint}>
            A payment prompt has been sent to your phone. Please enter your M-Pesa PIN to complete the payment.
          </Text>
          <View style={styles.mpesaWaitingAmount}>
            <Text style={styles.mpesaWaitingAmountLabel}>Amount</Text>
            <Text style={styles.mpesaWaitingAmountValue}>KES {serviceDetails?.amount?.toLocaleString()}</Text>
          </View>
        </View>
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

      {/* Payment Method (Pre-selected at booking) */}
      <Text style={styles.sectionTitle}>Payment Method</Text>
      <Text style={styles.sectionSubtitle}>Selected at booking time</Text>
      <View style={styles.methodsContainer}>
        <View style={[styles.methodCard, styles.methodCardActive, styles.methodReadOnly]}>
          {paymentMethod === 'mpesa' ? (
            <>
              <View style={[styles.methodIcon, { backgroundColor: '#4CAF50' }]}>
                <Text style={styles.methodIconText}>M</Text>
              </View>
              <Text style={styles.methodName}>M-Pesa</Text>
            </>
          ) : (
            <>
              <View style={[styles.methodIcon, { backgroundColor: COLORS.primary }]}>
                <Ionicons name="wallet" size={20} color={COLORS.white} />
              </View>
              <Text style={styles.methodName}>Wallet</Text>
            </>
          )}
          <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} style={styles.checkIcon} />
        </View>
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
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  methodsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  methodReadOnly: {
    opacity: 1,
    backgroundColor: '#F0F8FF',
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
  mpesaWaitingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    width: '100%',
  },
  mpesaWaitingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  mpesaWaitingMessage: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  mpesaWaitingHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  mpesaWaitingAmount: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  mpesaWaitingAmountLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  mpesaWaitingAmountValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});
