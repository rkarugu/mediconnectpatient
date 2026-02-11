import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { Card } from '../components';
import labService, { LabRequestDetail, LabTestWithResults, LabResult } from '../services/labService';
import useRealtimeRefresh from '../hooks/useRealtimeRefresh';

const FLAG_CONFIG: Record<string, { color: string; bgColor: string; icon: string }> = {
  normal: { color: '#10B981', bgColor: '#D1FAE5', icon: 'checkmark-circle' },
  low: { color: '#F59E0B', bgColor: '#FEF3C7', icon: 'arrow-down-circle' },
  high: { color: '#F59E0B', bgColor: '#FEF3C7', icon: 'arrow-up-circle' },
  critical: { color: '#EF4444', bgColor: '#FEE2E2', icon: 'alert-circle' },
  abnormal: { color: '#8B5CF6', bgColor: '#EDE9FE', icon: 'warning' },
};

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; label: string }> = {
  pending: { color: '#F59E0B', bgColor: '#FEF3C7', label: 'Pending' },
  assigned: { color: '#3B82F6', bgColor: '#DBEAFE', label: 'Assigned' },
  collector_dispatched: { color: '#8B5CF6', bgColor: '#EDE9FE', label: 'Collector Dispatched' },
  sample_collected: { color: '#6366F1', bgColor: '#E0E7FF', label: 'Sample Collected' },
  processing: { color: '#EC4899', bgColor: '#FCE7F3', label: 'Processing' },
  completed: { color: '#10B981', bgColor: '#D1FAE5', label: 'Completed' },
  cancelled: { color: '#EF4444', bgColor: '#FEE2E2', label: 'Cancelled' },
};

export default function LabResultsScreen({ route, navigation }: any) {
  const { requestId } = route.params;
  const insets = useSafeAreaInsets();
  const [labRequest, setLabRequest] = useState<LabRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTests, setExpandedTests] = useState<Set<number>>(new Set());

  const fetchLabRequest = async () => {
    try {
      const data = await labService.getLabRequest(requestId);
      setLabRequest(data);
      // Auto-expand all tests with results
      const testsWithResults = data.tests
        .filter(t => t.has_results)
        .map(t => t.id);
      setExpandedTests(new Set(testsWithResults));
    } catch (error) {
      console.error('Failed to fetch lab request:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLabRequest();
  }, [requestId]);

  useRealtimeRefresh(fetchLabRequest, {
    events: ['lab_results.ready', 'lab_request.created', 'service.completed'],
    intervalMs: 30000,
    enabled: true,
  });

  const onRefresh = () => {
    setRefreshing(true);
    fetchLabRequest();
  };

  const toggleTest = (testId: number) => {
    setExpandedTests(prev => {
      const next = new Set(prev);
      if (next.has(testId)) {
        next.delete(testId);
      } else {
        next.add(testId);
      }
      return next;
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderResult = (result: LabResult) => {
    const flagConfig = FLAG_CONFIG[result.flag] || FLAG_CONFIG.normal;

    return (
      <View key={result.id} style={styles.resultRow}>
        <View style={styles.resultMain}>
          <Text style={styles.parameterName}>{result.parameter_name}</Text>
          <View style={styles.resultValueRow}>
            <Text style={styles.resultValue}>{result.result_value}</Text>
            {result.unit && <Text style={styles.resultUnit}>{result.unit}</Text>}
          </View>
        </View>
        <View style={styles.resultMeta}>
          {result.reference_range && (
            <Text style={styles.referenceRange}>Ref: {result.reference_range}</Text>
          )}
          <View style={[styles.flagBadge, { backgroundColor: flagConfig.bgColor }]}>
            <Ionicons name={flagConfig.icon as any} size={14} color={flagConfig.color} />
            <Text style={[styles.flagText, { color: flagConfig.color }]}>
              {result.flag.charAt(0).toUpperCase() + result.flag.slice(1)}
            </Text>
          </View>
        </View>
        {result.comments && (
          <Text style={styles.resultComments}>{result.comments}</Text>
        )}
      </View>
    );
  };

  const renderTest = (test: LabTestWithResults) => {
    const isExpanded = expandedTests.has(test.id);

    return (
      <Card key={test.id} style={styles.testCard}>
        <TouchableOpacity
          style={styles.testHeader}
          onPress={() => toggleTest(test.id)}
          activeOpacity={0.7}
        >
          <View style={styles.testInfo}>
            <Text style={styles.testName}>{test.name}</Text>
            <Text style={styles.testCode}>{test.code} - {test.category}</Text>
          </View>
          <View style={styles.testHeaderRight}>
            {test.has_results ? (
              <View style={[styles.resultBadge, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="checkmark" size={14} color="#10B981" />
                <Text style={[styles.resultBadgeText, { color: '#10B981' }]}>Results Ready</Text>
              </View>
            ) : (
              <View style={[styles.resultBadge, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="time" size={14} color="#F59E0B" />
                <Text style={[styles.resultBadgeText, { color: '#F59E0B' }]}>Pending</Text>
              </View>
            )}
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={COLORS.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.testContent}>
            {test.description && (
              <Text style={styles.testDescription}>{test.description}</Text>
            )}
            {test.has_results ? (
              <View style={styles.resultsContainer}>
                {test.results.map(renderResult)}
              </View>
            ) : (
              <View style={styles.pendingContainer}>
                <Ionicons name="hourglass-outline" size={32} color={COLORS.textTertiary} />
                <Text style={styles.pendingText}>Results are being processed</Text>
              </View>
            )}
          </View>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading lab results...</Text>
      </View>
    );
  }

  if (!labRequest) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorTitle}>Request Not Found</Text>
        <Text style={styles.errorText}>This lab request could not be found.</Text>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusConfig = STATUS_CONFIG[labRequest.status] || STATUS_CONFIG.pending;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lab Results</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
            {labRequest.is_urgent && (
              <View style={styles.urgentBadge}>
                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                <Text style={styles.urgentText}>Urgent</Text>
              </View>
            )}
          </View>

          {labRequest.has_critical && (
            <View style={styles.criticalAlert}>
              <Ionicons name="warning" size={20} color="#EF4444" />
              <Text style={styles.criticalAlertText}>
                This report contains critical values. Please consult your doctor.
              </Text>
            </View>
          )}

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="business-outline" size={18} color={COLORS.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Lab Facility</Text>
                <Text style={styles.infoValue}>
                  {labRequest.lab_facility?.name || 'N/A'}
                </Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="medical-outline" size={18} color={COLORS.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Ordered By</Text>
                <Text style={styles.infoValue}>Dr. {labRequest.medic_name}</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Requested</Text>
                <Text style={styles.infoValue}>{formatDate(labRequest.created_at)}</Text>
              </View>
            </View>
            {labRequest.completed_at && (
              <View style={styles.infoItem}>
                <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Completed</Text>
                  <Text style={styles.infoValue}>{formatDate(labRequest.completed_at)}</Text>
                </View>
              </View>
            )}
          </View>

          {labRequest.clinical_notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Clinical Notes</Text>
              <Text style={styles.notesText}>{labRequest.clinical_notes}</Text>
            </View>
          )}
        </Card>

        {/* Test Results */}
        <Text style={styles.sectionTitle}>Test Results</Text>
        {labRequest.tests.map(renderTest)}

        <View style={styles.bottomPadding} />
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
    padding: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  statusCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  urgentText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: '#EF4444',
    fontWeight: '600',
  },
  criticalAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#FEE2E2',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  criticalAlertText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: '#EF4444',
    flex: 1,
  },
  infoGrid: {
    gap: SPACING.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  notesSection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  notesLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  notesText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textPrimary,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  testCard: {
    marginBottom: SPACING.sm,
    padding: 0,
    overflow: 'hidden',
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  testCode: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  testHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  resultBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
  },
  testContent: {
    padding: SPACING.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  testDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontStyle: 'italic',
  },
  resultsContainer: {
    gap: SPACING.sm,
  },
  resultRow: {
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  resultMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  parameterName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textPrimary,
    flex: 1,
  },
  resultValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  resultValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  resultUnit: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  resultMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  referenceRange: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  flagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  flagText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
  },
  resultComments: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  pendingContainer: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  pendingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textTertiary,
    marginTop: SPACING.sm,
  },
  bottomPadding: {
    height: SPACING.xl,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  backLink: {
    marginTop: SPACING.lg,
  },
  backLinkText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
