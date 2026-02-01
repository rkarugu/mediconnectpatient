import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { Card } from '../components';
import labService, { LabRequestSummary, PendingLabRequest } from '../services/labService';

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; label: string; action?: string }> = {
  pending: { color: '#F59E0B', bgColor: '#FEF3C7', label: 'Awaiting Confirmation', action: 'Tap to confirm & pay' },
  assigned: { color: '#3B82F6', bgColor: '#DBEAFE', label: 'Awaiting Payment', action: 'Tap to confirm & pay' },
  collector_dispatched: { color: '#8B5CF6', bgColor: '#EDE9FE', label: 'Collector Dispatched' },
  sample_collected: { color: '#6366F1', bgColor: '#E0E7FF', label: 'Sample Collected' },
  processing: { color: '#EC4899', bgColor: '#FCE7F3', label: 'Processing' },
  completed: { color: '#10B981', bgColor: '#D1FAE5', label: 'Completed' },
  cancelled: { color: '#EF4444', bgColor: '#FEE2E2', label: 'Cancelled' },
};

export default function LabRequestsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<LabRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await labService.getLabRequests();
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch lab requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }: { item: LabRequestSummary }) => {
    const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const needsConfirmation = item.status === 'pending' || item.status === 'assigned';

    const handlePress = () => {
      if (needsConfirmation) {
        navigation.navigate('LabConsent', { requestId: item.id });
      } else {
        navigation.navigate('LabResults', { requestId: item.id });
      }
    };

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Card style={styles.requestCard}>
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <Ionicons name="flask" size={24} color={COLORS.primary} />
              <View style={styles.headerInfo}>
                <Text style={styles.labName}>
                  {item.lab_facility?.name || 'Lab Facility'}
                </Text>
                <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.testsContainer}>
            <Text style={styles.testsLabel}>Tests Ordered:</Text>
            <View style={styles.testsList}>
              {item.tests.slice(0, 3).map((test, index) => (
                <View key={test.id} style={styles.testChip}>
                  <Text style={styles.testChipText}>{test.name}</Text>
                </View>
              ))}
              {item.tests.length > 3 && (
                <View style={[styles.testChip, styles.moreChip]}>
                  <Text style={styles.moreChipText}>+{item.tests.length - 3} more</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.footerItem}>
              <Ionicons name="medical" size={16} color={COLORS.textSecondary} />
              <Text style={styles.footerText}>Dr. {item.medic_name}</Text>
            </View>
            {item.is_urgent && (
              <View style={styles.urgentBadge}>
                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                <Text style={styles.urgentText}>Urgent</Text>
              </View>
            )}
          </View>

          {needsConfirmation && (
            <View style={styles.actionRow}>
              <View style={styles.actionContent}>
                <Ionicons name="card" size={16} color={COLORS.primary} />
                <Text style={styles.actionText}>Tap to confirm & pay</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
            </View>
          )}

          {item.status === 'completed' && (
            <View style={styles.viewResultsRow}>
              <Text style={styles.viewResultsText}>View Results</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="flask-outline" size={64} color={COLORS.textTertiary} />
      <Text style={styles.emptyTitle}>No Lab Tests</Text>
      <Text style={styles.emptyText}>
        You don't have any lab test requests yet. Lab tests will appear here when ordered by your doctor.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading lab requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lab Tests</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={requests}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContent,
          requests.length === 0 && styles.emptyList,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
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
  listContent: {
    padding: SPACING.md,
  },
  emptyList: {
    flex: 1,
  },
  requestCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerInfo: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  labName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  dateText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  testsContainer: {
    marginBottom: SPACING.sm,
  },
  testsLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  testsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  testChip: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.small,
  },
  testChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '500',
  },
  moreChip: {
    backgroundColor: COLORS.background,
  },
  moreChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
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
    ...TYPOGRAPHY.caption,
    color: '#EF4444',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    marginHorizontal: -SPACING.md,
    marginBottom: -SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomLeftRadius: BORDER_RADIUS.medium,
    borderBottomRightRadius: BORDER_RADIUS.medium,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  actionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  viewResultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  viewResultsText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
});
