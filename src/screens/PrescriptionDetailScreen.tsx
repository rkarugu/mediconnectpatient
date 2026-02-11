import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { Card } from '../components';
import { MedicalHistoryItem, PrescriptionDetails } from '../services/medicalRecordsService';

export default function PrescriptionDetailScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const item: MedicalHistoryItem = route.params?.item;
  const details = item?.details as PrescriptionDetails;

  if (!item || !details) {
    return (
      <View style={styles.container}>
        <Text>Record not found</Text>
      </View>
    );
  }

  const handleDownloadPdf = () => {
    if (details.pdf_url) {
      Linking.openURL(details.pdf_url).catch(() => {
        Alert.alert('Error', 'Unable to open the PDF.');
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prescription Details</Text>
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
            <View style={[styles.iconBg, { backgroundColor: '#059669' + '15' }]}>
              <Ionicons name="document-text-outline" size={32} color="#059669" />
            </View>
            <View style={styles.topInfo}>
              <Text style={styles.topTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.topSubtitle}>{item.subtitle}</Text>
              <Text style={styles.topDate}>{item.date_formatted}</Text>
            </View>
          </View>
        </Card>

        {/* Doctor & Specialty */}
        <Card style={styles.sectionCard} variant="elevated">
          <Text style={styles.sectionTitle}>Prescribing Doctor</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color={COLORS.primary} />
            <Text style={styles.infoText}>{details.medic_name}</Text>
          </View>
          {details.specialty && (
            <View style={styles.infoRow}>
              <Ionicons name="medical-outline" size={18} color={COLORS.primary} />
              <Text style={styles.infoText}>{details.specialty}</Text>
            </View>
          )}
        </Card>

        {/* Diagnosis */}
        {details.diagnosis && (
          <Card style={styles.sectionCard} variant="elevated">
            <Text style={styles.sectionTitle}>Diagnosis</Text>
            <Text style={styles.bodyText}>{details.diagnosis}</Text>
          </Card>
        )}

        {/* Medications */}
        {details.medications && details.medications.length > 0 && (
          <Card style={styles.sectionCard} variant="elevated">
            <Text style={styles.sectionTitle}>
              Medications ({details.medications.length})
            </Text>
            {details.medications.map((med: any, index: number) => (
              <View
                key={index}
                style={[
                  styles.medicationCard,
                  index < details.medications!.length - 1 && styles.medicationBorder,
                ]}
              >
                <View style={styles.medHeader}>
                  <View style={styles.medNumber}>
                    <Text style={styles.medNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.medName}>{med.name || 'Unknown Medication'}</Text>
                </View>
                <View style={styles.medDetails}>
                  {med.dosage && (
                    <View style={styles.medDetailItem}>
                      <Text style={styles.medDetailLabel}>Dosage</Text>
                      <Text style={styles.medDetailValue}>{med.dosage}</Text>
                    </View>
                  )}
                  {med.frequency && (
                    <View style={styles.medDetailItem}>
                      <Text style={styles.medDetailLabel}>Frequency</Text>
                      <Text style={styles.medDetailValue}>{med.frequency}</Text>
                    </View>
                  )}
                  {med.duration && (
                    <View style={styles.medDetailItem}>
                      <Text style={styles.medDetailLabel}>Duration</Text>
                      <Text style={styles.medDetailValue}>{med.duration}</Text>
                    </View>
                  )}
                  {med.instructions && (
                    <View style={styles.medDetailItem}>
                      <Text style={styles.medDetailLabel}>Instructions</Text>
                      <Text style={styles.medDetailValue}>{med.instructions}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Instructions */}
        {details.instructions && (
          <Card style={styles.sectionCard} variant="elevated">
            <Text style={styles.sectionTitle}>General Instructions</Text>
            <Text style={styles.bodyText}>{details.instructions}</Text>
          </Card>
        )}

        {/* Notes */}
        {details.notes && (
          <Card style={styles.sectionCard} variant="elevated">
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.bodyText}>{details.notes}</Text>
          </Card>
        )}

        {/* PDF Download */}
        {details.pdf_url && (
          <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadPdf}>
            <Ionicons name="download-outline" size={20} color={COLORS.white} />
            <Text style={styles.downloadText}>Download PDF</Text>
          </TouchableOpacity>
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textPrimary,
  },
  bodyText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  medicationCard: {
    paddingVertical: SPACING.sm,
  },
  medicationBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  medHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  medNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  medNumberText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  medName: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  medDetails: {
    marginLeft: 36,
    gap: 4,
  },
  medDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  medDetailLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    width: 80,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  medDetailValue: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textPrimary,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    ...SHADOWS.md,
  },
  downloadText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.white,
  },
});
