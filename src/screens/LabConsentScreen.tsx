import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { Card, Button } from '../components';
import labService, { LabRequestDetail } from '../services/labService';
import useRealtimeRefresh from '../hooks/useRealtimeRefresh';

export default function LabConsentScreen({ navigation, route }: any) {
  const { requestId } = route.params;
  const insets = useSafeAreaInsets();
  const [request, setRequest] = useState<LabRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'mpesa'>('wallet');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [awaitingMpesa, setAwaitingMpesa] = useState(false);
  const [mpesaMessage, setMpesaMessage] = useState('');

  const fetchRequest = useCallback(async () => {
    try {
      const data = await labService.getLabRequest(requestId);
      setRequest(data);
      
      // If already paid, navigate back immediately
      if (data.payment_status === 'paid') {
        Alert.alert(
          'Already Paid',
          'This lab request has already been paid for.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }
      
      // Set payment method from the parent service request (pre-selected at booking)
      const preSelectedMethod = data.payment_method || 'wallet';
      if (preSelectedMethod === 'wallet' || preSelectedMethod === 'mpesa') {
        setPaymentMethod(preSelectedMethod as 'wallet' | 'mpesa');
      }
    } catch (error) {
      console.error('Failed to fetch lab request:', error);
      Alert.alert('Error', 'Failed to load lab request details');
    } finally {
      setLoading(false);
    }
  }, [requestId, navigation]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  useRealtimeRefresh(fetchRequest, {
    events: ['lab_request.created', 'lab_results.ready', 'service.completed'],
    intervalMs: 30000,
    enabled: true,
  });

  const validatePhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 9 && cleaned.length <= 12;
  };

  const pollLabPaymentStatus = useCallback(async (labRequestId: number, maxAttempts = 20) => {
    let attempts = 0;
    const poll = async (): Promise<boolean> => {
      attempts++;
      try {
        const details = await labService.getLabRequest(labRequestId);
        const paymentStatus = details.payment_status;
        
        if (paymentStatus === 'paid') {
          setMpesaMessage('Payment confirmed!');
          setTimeout(() => {
            Alert.alert(
              'Payment Successful',
              'Your lab test payment has been confirmed. The lab will dispatch a sample collector shortly.',
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
          }, 1000);
          return true;
        } else if (paymentStatus === 'failed') {
          setAwaitingMpesa(false);
          setConfirming(false);
          Alert.alert('Payment Failed', 'The M-Pesa payment was not completed. Please try again.');
          return true;
        }
      } catch (e) {
        console.log('Poll error:', e);
      }

      if (attempts >= maxAttempts) {
        setAwaitingMpesa(false);
        setConfirming(false);
        Alert.alert(
          'Payment Pending',
          'We haven\'t received confirmation yet. If you completed the payment, it will be updated shortly.',
          [
            { text: 'Try Again', style: 'cancel' },
            { text: 'Go Back', onPress: () => navigation.goBack() },
          ]
        );
        return true;
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
      return poll();
    };

    return poll();
  }, [navigation]);

  const handleConfirm = async () => {
    if (!request) return;

    if (paymentMethod === 'mpesa' && !validatePhoneNumber(phoneNumber)) {
      Alert.alert('Invalid Phone', 'Please enter a valid M-Pesa phone number');
      return;
    }

    const testsTotal = request.tests?.reduce((sum, test) => sum + (parseFloat(String(test.price)) || 0), 0) || 0;
    const fee = parseFloat(String(request.collection_fee)) || 0;
    const total = testsTotal + fee;
    const paymentLabel = paymentMethod === 'wallet' ? 'Wallet' : 'M-Pesa';

    setConfirming(true);
    try {
      let formattedPhone = phoneNumber;
      if (paymentMethod === 'mpesa') {
        formattedPhone = phoneNumber.replace(/\D/g, '');
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '254' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('254')) {
          formattedPhone = '254' + formattedPhone;
        }
      }

      const result = await labService.confirmAndPay(
        requestId,
        paymentMethod,
        paymentMethod === 'mpesa' ? formattedPhone : undefined
      );

      if (paymentMethod === 'mpesa') {
        setAwaitingMpesa(true);
        setMpesaMessage('STK Push sent! Enter your M-Pesa PIN on your phone...');
        pollLabPaymentStatus(requestId);
      } else {
        const newBalance = result?.payment?.new_wallet_balance;
        let successMsg = `KES ${total.toLocaleString()} paid via ${paymentLabel}.`;
        if (newBalance != null) {
          successMsg += `\nNew wallet balance: KES ${Number(newBalance).toLocaleString()}`;
        }
        successMsg += '\n\nThe lab has been notified and will dispatch a sample collector shortly.';
        Alert.alert(
          'Payment Successful',
          successMsg,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        setConfirming(false);
      }
    } catch (error: any) {
      setConfirming(false);
      const msg = error?.response?.data?.message || error.message || 'Failed to confirm lab request';
      Alert.alert('Payment Failed', msg);
    }
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Lab Test',
      'Are you sure you want to decline this lab test request? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await labService.declineRequest(requestId);
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to decline lab request');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading request details...</Text>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorText}>Failed to load request</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} style={styles.errorButton} />
      </View>
    );
  }

  const testsSubtotal = request.tests?.reduce((sum, test) => sum + (parseFloat(String(test.price)) || 0), 0) || 0;
  const collectionFee = parseFloat(String(request.collection_fee)) || 0;
  const totalCost = testsSubtotal + collectionFee;

  if (awaitingMpesa) {
    return (
      <View style={[styles.container, styles.centered, { paddingHorizontal: 32 }]}>
        <View style={styles.mpesaWaitingCard}>
          <View style={[styles.methodIcon, { backgroundColor: '#4CAF50', width: 72, height: 72, borderRadius: 36, marginBottom: 20 }]}>
            <Text style={[styles.methodIconText, { fontSize: 36, color: COLORS.white }]}>M</Text>
          </View>
          <ActivityIndicator size="large" color="#4CAF50" style={{ marginBottom: 16 }} />
          <Text style={styles.mpesaWaitingTitle}>M-Pesa Payment</Text>
          <Text style={styles.mpesaWaitingMessage}>{mpesaMessage}</Text>
          <Text style={styles.mpesaWaitingHint}>
            A payment prompt has been sent to your phone. Please enter your M-Pesa PIN to complete the payment.
          </Text>
          <View style={styles.mpesaWaitingAmount}>
            <Text style={styles.mpesaWaitingAmountLabel}>Amount</Text>
            <Text style={styles.mpesaWaitingAmountValue}>KES {totalCost.toLocaleString()}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Lab Test</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color={COLORS.primary} />
            <Text style={styles.infoTitle}>Lab Test Request</Text>
          </View>
          <Text style={styles.infoText}>
            Your doctor has ordered the following lab tests. Please review and confirm to proceed with sample collection.
          </Text>
        </Card>

        <Card style={styles.doctorCard}>
          <Text style={styles.sectionTitle}>Ordered By</Text>
          <View style={styles.doctorInfo}>
            <View style={styles.doctorAvatar}>
              <Ionicons name="person" size={24} color={COLORS.white} />
            </View>
            <View style={styles.doctorDetails}>
              <Text style={styles.doctorName}>Dr. {request.medic_name || 'Unknown'}</Text>
              <Text style={styles.doctorDate}>{formatDate(request.created_at)}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.testsCard}>
          <Text style={styles.sectionTitle}>Tests Ordered</Text>
          {request.tests?.map((test, index) => (
            <View key={test.id || index} style={styles.testItem}>
              <View style={styles.testInfo}>
                <Ionicons name="flask" size={20} color={COLORS.primary} />
                <View style={styles.testDetails}>
                  <Text style={styles.testName}>{test.name}</Text>
                  {test.description && (
                    <Text style={styles.testDescription}>{test.description}</Text>
                  )}
                </View>
              </View>
              <Text style={styles.testPrice}>KES {(parseFloat(String(test.price)) || 0).toLocaleString()}</Text>
            </View>
          ))}
          {collectionFee > 0 && (
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Collection Fee</Text>
              <Text style={styles.feeAmount}>KES {collectionFee.toLocaleString()}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Cost</Text>
            <Text style={styles.totalAmount}>KES {totalCost.toLocaleString()}</Text>
          </View>
        </Card>

        {request.is_urgent && (
          <Card style={styles.urgentCard}>
            <View style={styles.urgentContent}>
              <Ionicons name="alert-circle" size={24} color="#EF4444" />
              <View style={styles.urgentText}>
                <Text style={styles.urgentTitle}>Urgent Request</Text>
                <Text style={styles.urgentDescription}>
                  This test has been marked as urgent by your doctor.
                </Text>
              </View>
            </View>
          </Card>
        )}

        <Card style={styles.paymentCard}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <Text style={styles.sectionSubtitle}>Selected at booking time</Text>
          <View style={styles.paymentMethods}>
            <View style={[styles.methodButton, styles.methodButtonActive, styles.methodReadOnly]}>
              {paymentMethod === 'wallet' ? (
                <>
                  <View style={[styles.methodIcon, styles.methodIconActive]}>
                    <Ionicons name="wallet" size={24} color={COLORS.white} />
                  </View>
                  <Text style={[styles.methodText, styles.methodTextActive]}>Wallet</Text>
                </>
              ) : (
                <>
                  <View style={[styles.methodIcon, styles.methodIconActive]}>
                    <Text style={[styles.methodIconText, styles.methodIconTextActive]}>M</Text>
                  </View>
                  <Text style={[styles.methodText, styles.methodTextActive]}>M-Pesa</Text>
                </>
              )}
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} style={{ position: 'absolute', top: 8, right: 8 }} />
            </View>
          </View>

          {paymentMethod === 'mpesa' && (
            <View style={styles.phoneInputContainer}>
              <Text style={styles.inputLabel}>M-Pesa Phone Number</Text>
              <View style={styles.phoneInputWrapper}>
                <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} style={styles.phoneIcon} />
                <TextInput
                  style={styles.phoneInput}
                  placeholder="0712345678"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              </View>
              <Text style={styles.inputHint}>Enter the phone number registered with M-Pesa</Text>
            </View>
          )}
        </Card>

        <Card style={styles.consentCard}>
          <Text style={styles.consentTitle}>Patient Consent</Text>
          <Text style={styles.consentText}>
            By confirming this request, I consent to:
          </Text>
          <View style={styles.consentList}>
            <View style={styles.consentItem}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              <Text style={styles.consentItemText}>
                Having my biological samples collected for testing
              </Text>
            </View>
            <View style={styles.consentItem}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              <Text style={styles.consentItemText}>
                Sharing test results with my treating physician
              </Text>
            </View>
            <View style={styles.consentItem}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              <Text style={styles.consentItemText}>
                Payment of the total cost for the tests ordered
              </Text>
            </View>
          </View>
        </Card>

        {request?.payment_status === 'paid' ? (
          <Card style={styles.paidCard}>
            <View style={styles.paidContent}>
              <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
              <Text style={styles.paidTitle}>Payment Confirmed</Text>
              <Text style={styles.paidMessage}>
                This lab request has been paid for. The lab will collect your samples soon.
              </Text>
            </View>
          </Card>
        ) : (
          <View style={styles.buttonsContainer}>
            <Button
              title={confirming ? 'Processing Payment...' : `Confirm & Pay via ${paymentMethod === 'wallet' ? 'Wallet' : 'M-Pesa'}`}
              onPress={handleConfirm}
              loading={confirming}
              disabled={confirming}
              style={styles.confirmButton}
            />
            <TouchableOpacity 
              onPress={handleDecline} 
              style={styles.declineButton}
              disabled={confirming}
            >
              <Text style={styles.declineText}>Decline Request</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.error,
    marginTop: SPACING.md,
  },
  errorButton: {
    marginTop: SPACING.md,
  },
  infoCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.primaryLight,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  infoTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.primary,
  },
  infoText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 22,
  },
  doctorCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorDetails: {
    marginLeft: SPACING.md,
  },
  doctorName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  doctorDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  testsCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  testItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  testInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  testDetails: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  testName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '500',
  },
  testDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  testPrice: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  feeLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  feeAmount: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.primary,
  },
  totalLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  totalAmount: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    fontWeight: '700',
  },
  urgentCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    backgroundColor: '#FEE2E2',
  },
  urgentContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  urgentText: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  urgentTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: '#EF4444',
  },
  urgentDescription: {
    ...TYPOGRAPHY.caption,
    color: '#DC2626',
    marginTop: 2,
  },
  consentCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  consentTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  consentText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  consentList: {
    gap: SPACING.sm,
  },
  consentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  consentItemText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
    lineHeight: 20,
  },
  buttonsContainer: {
    marginTop: SPACING.md,
  },
  confirmButton: {
    marginBottom: SPACING.md,
  },
  declineButton: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  declineText: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
    fontWeight: '600',
  },
  paymentCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: SPACING.xs,
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  methodButton: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  methodReadOnly: {
    opacity: 1,
    backgroundColor: '#F0F8FF',
  },
  methodButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  methodIconActive: {
    backgroundColor: COLORS.primary,
  },
  methodIconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  methodIconTextActive: {
    color: COLORS.white,
  },
  methodText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '500',
  },
  methodTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  phoneInputContainer: {
    marginTop: SPACING.md,
  },
  inputLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  phoneIcon: {
    marginRight: SPACING.xs,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: SPACING.sm,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  inputHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
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
  paidCard: {
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  paidContent: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  paidTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.success,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  paidMessage: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
