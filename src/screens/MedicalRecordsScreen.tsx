import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { LoadingSpinner, Card } from '../components';
import medicalRecordsService, {
  MedicalHistoryItem,
  MedicalHistorySummary,
  PrescriptionDetails,
  LabResultDetails,
  ConsultationNoteDetails,
  UploadDetails,
} from '../services/medicalRecordsService';

const FILTER_TABS = [
  { key: 'all', label: 'All', icon: 'albums-outline' },
  { key: 'consultation_note', label: 'Consultations', icon: 'clipboard-outline' },
  { key: 'prescription', label: 'Prescriptions', icon: 'document-text-outline' },
  { key: 'lab_result', label: 'Lab Results', icon: 'flask-outline' },
  { key: 'upload', label: 'Uploads', icon: 'cloud-upload-outline' },
];

export default function MedicalRecordsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<MedicalHistoryItem[]>([]);
  const [summary, setSummary] = useState<MedicalHistorySummary>({ total: 0, prescriptions: 0, lab_results: 0, consultation_notes: 0, uploads: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const loadHistory = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const data = await medicalRecordsService.getMedicalHistory(activeFilter);
      setHistory(data.history);
      setSummary(data.summary);
    } catch (error) {
      console.error('Failed to load medical history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadHistory(false);
  };

  const handleItemPress = (item: MedicalHistoryItem) => {
    if (item.source_type === 'prescription') {
      navigation.navigate('PrescriptionDetail', { item });
    } else if (item.source_type === 'lab_result') {
      navigation.navigate('LabResultDetail', { item });
    } else if (item.source_type === 'consultation_note') {
      navigation.navigate('ConsultationNoteDetail', { item });
    } else if (item.source_type === 'upload') {
      const details = item.details as UploadDetails;
      if (details.file_url) {
        Linking.openURL(details.file_url).catch(() => {
          Alert.alert('Error', 'Unable to open this file.');
        });
      }
    }
  };

  const getSourceLabel = (type: string) => {
    switch (type) {
      case 'prescription': return 'Prescription';
      case 'lab_result': return 'Lab Result';
      case 'consultation_note': return 'Consultation';
      case 'upload': return 'Uploaded';
      default: return type;
    }
  };

  const renderSummaryCards = () => (
    <View style={styles.summaryContainer}>
      <View style={[styles.summaryCard, { backgroundColor: '#059669' + '12' }]}>  
        <Ionicons name="document-text-outline" size={22} color="#059669" />
        <Text style={[styles.summaryCount, { color: '#059669' }]}>{summary.prescriptions}</Text>
        <Text style={styles.summaryLabel}>Prescriptions</Text>
      </View>
      <View style={[styles.summaryCard, { backgroundColor: '#7C3AED' + '12' }]}>
        <Ionicons name="flask-outline" size={22} color="#7C3AED" />
        <Text style={[styles.summaryCount, { color: '#7C3AED' }]}>{summary.lab_results}</Text>
        <Text style={styles.summaryLabel}>Lab Results</Text>
      </View>
      <View style={[styles.summaryCard, { backgroundColor: '#0284C7' + '12' }]}>
        <Ionicons name="clipboard-outline" size={22} color="#0284C7" />
        <Text style={[styles.summaryCount, { color: '#0284C7' }]}>{summary.consultation_notes}</Text>
        <Text style={styles.summaryLabel}>Consultations</Text>
      </View>
      <View style={[styles.summaryCard, { backgroundColor: '#2563EB' + '12' }]}>
        <Ionicons name="cloud-upload-outline" size={22} color="#2563EB" />
        <Text style={[styles.summaryCount, { color: '#2563EB' }]}>{summary.uploads}</Text>
        <Text style={styles.summaryLabel}>Uploads</Text>
      </View>
    </View>
  );

  const renderHistoryItem = (item: MedicalHistoryItem) => {
    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.7}
        onPress={() => handleItemPress(item)}
      >
        <Card style={styles.recordCard} variant="elevated">
          <View style={styles.recordHeader}>
            <View style={[styles.typeIcon, { backgroundColor: item.color + '15' }]}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <View style={styles.recordInfo}>
              <View style={styles.titleRow}>
                <Text style={styles.recordTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.badge && (
                  <View style={[styles.badge, { backgroundColor: item.color + '20' }]}>
                    <Text style={[styles.badgeText, { color: item.color }]}>{item.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.recordSubtitle} numberOfLines={1}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
          </View>

          <View style={styles.recordMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{item.date_formatted}</Text>
            </View>
            <View style={[styles.sourceTag, { backgroundColor: item.color + '10' }]}>
              <Text style={[styles.sourceTagText, { color: item.color }]}>
                {getSourceLabel(item.source_type)}
              </Text>
            </View>
          </View>

          {/* Prescription preview */}
          {item.source_type === 'prescription' && (item.details as PrescriptionDetails).medications && (
            <View style={styles.previewSection}>
              <Text style={styles.previewLabel}>Medications:</Text>
              {((item.details as PrescriptionDetails).medications || []).slice(0, 2).map((med: any, idx: number) => (
                <Text key={idx} style={styles.previewItem} numberOfLines={1}>
                  {med.name} {med.dosage ? `- ${med.dosage}` : ''}
                </Text>
              ))}
              {((item.details as PrescriptionDetails).medications || []).length > 2 && (
                <Text style={styles.previewMore}>
                  +{((item.details as PrescriptionDetails).medications || []).length - 2} more
                </Text>
              )}
            </View>
          )}

          {/* Lab result preview */}
          {item.source_type === 'lab_result' && (item.details as LabResultDetails).results?.length > 0 && (
            <View style={styles.previewSection}>
              <Text style={styles.previewLabel}>
                {(item.details as LabResultDetails).results.length} parameter(s)
                {(item.details as LabResultDetails).has_abnormal && ' - Abnormal values detected'}
              </Text>
            </View>
          )}

          {/* Consultation note preview */}
          {item.source_type === 'consultation_note' && (() => {
            const d = item.details as ConsultationNoteDetails;
            return (
              <View style={styles.previewSection}>
                {d.diagnosis && (
                  <Text style={styles.previewItem} numberOfLines={1}>
                    Diagnosis: {d.diagnosis}
                  </Text>
                )}
                {d.chief_complaint && (
                  <Text style={styles.previewItem} numberOfLines={1}>
                    Complaint: {d.chief_complaint}
                  </Text>
                )}
              </View>
            );
          })()}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medical Records</Text>
        <TouchableOpacity
          style={styles.addHeaderButton}
          onPress={() => navigation.navigate('AddMedicalRecord')}
        >
          <Ionicons name="add-circle" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.filterChip,
              activeFilter === tab.key && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={14}
              color={activeFilter === tab.key ? COLORS.white : COLORS.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.filterChipText,
                activeFilter === tab.key && styles.filterChipTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <LoadingSpinner fullScreen text="Loading medical records..." />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="folder-open-outline" size={64} color={COLORS.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>No Medical Records</Text>
              <Text style={styles.emptySubtitle}>
                Your prescriptions and lab results from consultations will appear here automatically.
                {'\n'}You can also upload historical records.
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('AddMedicalRecord')}
              >
                <Ionicons name="cloud-upload-outline" size={20} color={COLORS.white} />
                <Text style={styles.emptyButtonText}>Upload Record</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Summary Cards */}
              {activeFilter === 'all' && renderSummaryCards()}

              {/* Timeline */}
              <Text style={styles.sectionTitle}>
                {activeFilter === 'all' ? 'All Records' : FILTER_TABS.find(t => t.key === activeFilter)?.label || 'Records'} ({history.length})
              </Text>

              {history.map(renderHistoryItem)}
            </>
          )}
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => navigation.navigate('AddMedicalRecord')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
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
    paddingBottom: SPACING.md,
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
  addHeaderButton: {
    padding: SPACING.xs,
  },
  filterContainer: {
    maxHeight: 52,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center' as const,
    gap: SPACING.sm,
  },
  filterChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.base,
    paddingBottom: 100,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  summaryCount: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  recordCard: {
    marginBottom: SPACING.md,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  recordInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  recordTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  recordSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  recordMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  sourceTag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  sourceTagText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  previewSection: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  previewLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  previewItem: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
    marginBottom: 2,
  },
  previewMore: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['5xl'],
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  emptyButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.white,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
});
