import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { Card, Button } from '../components';
import labService, { LabRequestDetail } from '../services/labService';

export default function LabConsentScreen({ navigation, route }: any) {
  const { requestId } = route.params;
  const insets = useSafeAreaInsets();
  const [request, setRequest] = useState<LabRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const fetchRequest = useCallback(async () => {
    try {
      const data = await labService.getLabRequest(requestId);
      setRequest(data);
    } catch (error) {
      console.error('Failed to fetch lab request:', error);
      Alert.alert('Error', 'Failed to load lab request details');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const handleConfirm = async () => {
    if (!request) return;

    setConfirming(true);
    try {
      await labService.confirmAndPay(requestId, 'mpesa');
      Alert.alert(
        'Success',
        'Lab test confirmed successfully. A sample collector will be dispatched shortly.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to confirm lab request');
    } finally {
      setConfirming(false);
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

  const totalCost = request.tests?.reduce((sum, test) => sum + (test.price || 0), 0) || 0;

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
              <Text style={styles.testPrice}>KES {test.price?.toLocaleString() || '0'}</Text>
            </View>
          ))}
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

        <View style={styles.buttonsContainer}>
          <Button
            title={confirming ? 'Confirming...' : 'Confirm & Pay'}
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
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    marginTop: SPACING.sm,
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
});
