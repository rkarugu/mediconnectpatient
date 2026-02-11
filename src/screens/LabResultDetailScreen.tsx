import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { Card } from '../components';
import { MedicalHistoryItem, LabResultDetails } from '../services/medicalRecordsService';

const FLAG_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  normal: { label: 'Normal', color: '#059669', bg: '#05966915' },
  low: { label: 'Low', color: '#D97706', bg: '#D9770615' },
  high: { label: 'High', color: '#D97706', bg: '#D9770615' },
  critical: { label: 'Critical', color: '#DC2626', bg: '#DC262615' },
  abnormal: { label: 'Abnormal', color: '#E11D48', bg: '#E11D4815' },
};

export default function LabResultDetailScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const item: MedicalHistoryItem = route.params?.item;
  const details = item?.details as LabResultDetails;

  if (!item || !details) {
    return (
      <View style={styles.container}>
        <Text>Record not found</Text>
      </View>
    );
  }

  const getFlagConfig = (flag: string | null) => {
    if (!flag) return FLAG_CONFIG.normal;
    return FLAG_CONFIG[flag] || FLAG_CONFIG.normal;
  };

  const abnormalCount = details.results?.filter(
    (r) => r.flag && ['low', 'high', 'critical', 'abnormal'].includes(r.flag)
  ).length || 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lab Results</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Card */}
        <Card style={styles.topCard} variant="elevated">
          <View style={styles.topRow}>
            <View style={[styles.iconBg, { backgroundColor: item.color + '15' }]}>
              <Ionicons name="flask-outline" size={32} color={item.color} />
            </View>
            <View style={styles.topInfo}>
              <Text style={styles.topTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.topSubtitle}>{item.subtitle}</Text>
              <Text style={styles.topDate}>{item.date_formatted}</Text>
            </View>
          </View>

          {/* Status badges */}
          <View style={styles.badgeRow}>
            {details.is_urgent && (
              <View style={[styles.statusBadge, { backgroundColor: '#DC262615' }]}>
                <Ionicons name="alert-circle" size={12} color="#DC2626" />
                <Text style={[styles.statusBadgeText, { color: '#DC2626' }]}>Urgent</Text>
              </View>
            )}
            <View style={[styles.statusBadge, { backgroundColor: details.has_abnormal ? '#D9770615' : '#05966915' }]}>
              <Text style={[styles.statusBadgeText, { color: details.has_abnormal ? '#D97706' : '#059669' }]}>
                {details.has_critical ? 'Critical Values' : details.has_abnormal ? `${abnormalCount} Abnormal` : 'All Normal'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Ordering Info */}
        <Card style={styles.sectionCard} variant="elevated">
          <Text style={styles.sectionTitle}>Order Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="person-outline" size={16} color={COLORS.primary} />
              <View>
                <Text style={styles.infoLabel}>Ordered By</Text>
                <Text style={styles.infoValue}>{details.ordered_by}</Text>
              </View>
            </View>
            {details.lab_facility && (
              <View style={styles.infoItem}>
                <Ionicons name="business-outline" size={16} color={COLORS.primary} />
                <View>
                  <Text style={styles.infoLabel}>Lab Facility</Text>
                  <Text style={styles.infoValue}>{details.lab_facility}</Text>
                </View>
              </View>
            )}
          </View>
        </Card>

        {/* Clinical Notes */}
        {details.clinical_notes && (
          <Card style={styles.sectionCard} variant="elevated">
            <Text style={styles.sectionTitle}>Clinical Notes</Text>
            <Text style={styles.bodyText}>{details.clinical_notes}</Text>
          </Card>
        )}

        {/* Tests Ordered */}
        {details.tests && details.tests.length > 0 && (
          <Card style={styles.sectionCard} variant="elevated">
            <Text style={styles.sectionTitle}>Tests Ordered ({details.tests.length})</Text>
            {details.tests.map((test: any, index: number) => (
              <View key={index} style={styles.testItem}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <View style={styles.testInfo}>
                  <Text style={styles.testName}>{test.name}</Text>
                  {test.category && <Text style={styles.testCategory}>{test.category}</Text>}
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Results */}
        {details.results && details.results.length > 0 && (
          <Card style={styles.sectionCard} variant="elevated">
            <Text style={styles.sectionTitle}>Results ({details.results.length})</Text>

            {/* Results Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Parameter</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Value</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.2, textAlign: 'center' }]}>Reference</Text>
              <Text style={[styles.tableHeaderText, { flex: 0.7, textAlign: 'center' }]}>Flag</Text>
            </View>

            {details.results.map((result: any, index: number) => {
              const flagCfg = getFlagConfig(result.flag);
              return (
                <View
                  key={index}
                  style={[
                    styles.tableRow,
                    index % 2 === 0 && styles.tableRowAlt,
                    result.flag && result.flag !== 'normal' && { backgroundColor: flagCfg.bg },
                  ]}
                >
                  <View style={{ flex: 2 }}>
                    <Text style={styles.paramName} numberOfLines={2}>{result.parameter_name}</Text>
                    {result.test_name && (
                      <Text style={styles.paramTestName} numberOfLines={1}>{result.test_name}</Text>
                    )}
                  </View>
                  <Text style={[styles.resultValue, { flex: 1, textAlign: 'center' }]}>
                    {result.result_value}{result.unit ? ` ${result.unit}` : ''}
                  </Text>
                  <Text style={[styles.referenceRange, { flex: 1.2, textAlign: 'center' }]} numberOfLines={2}>
                    {result.reference_range || '-'}
                  </Text>
                  <View style={{ flex: 0.7, alignItems: 'center' }}>
                    {result.flag && result.flag !== 'normal' ? (
                      <View style={[styles.flagBadge, { backgroundColor: flagCfg.bg }]}>
                        <Text style={[styles.flagText, { color: flagCfg.color }]}>
                          {flagCfg.label}
                        </Text>
                      </View>
                    ) : (
                      <Ionicons name="checkmark-circle" size={16} color="#059669" />
                    )}
                  </View>
                </View>
              );
            })}
          </Card>
        )}

        {/* Result Comments */}
        {details.results?.some((r: any) => r.comments) && (
          <Card style={styles.sectionCard} variant="elevated">
            <Text style={styles.sectionTitle}>Comments</Text>
            {details.results
              .filter((r: any) => r.comments)
              .map((r: any, index: number) => (
                <View key={index} style={styles.commentItem}>
                  <Text style={styles.commentParam}>{r.parameter_name}:</Text>
                  <Text style={styles.commentText}>{r.comments}</Text>
                </View>
              ))}
          </Card>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.base,
    paddingBottom: 40,
  },
  topCard: {
    marginBottom: SPACING.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBg: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  topInfo: {
    flex: 1,
  },
  topTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  topSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  topDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    flexWrap: 'wrap',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  statusBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  sectionCard: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoGrid: {
    gap: SPACING.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  bodyText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 6,
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  testCategory: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  tableRowAlt: {
    backgroundColor: COLORS.backgroundDark,
  },
  paramName: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  paramTestName: {
    fontSize: 10,
    color: COLORS.textTertiary,
  },
  resultValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  referenceRange: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  flagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  flagText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  commentItem: {
    marginBottom: SPACING.sm,
  },
  commentParam: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  commentText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
