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
import { MedicalHistoryItem, ConsultationNoteDetails } from '../services/medicalRecordsService';

export default function ConsultationNoteDetailScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const item: MedicalHistoryItem = route.params?.item;
  const details = item?.details as ConsultationNoteDetails;

  if (!item || !details) {
    return (
      <View style={styles.container}>
        <Text>Record not found</Text>
      </View>
    );
  }

  const vitals = details.vital_signs;
  const hasVitals = vitals && Object.values(vitals).some((v) => v);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Consultation Notes</Text>
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
            <View style={[styles.iconBg, { backgroundColor: '#0284C715' }]}>
              <Ionicons name="clipboard-outline" size={32} color="#0284C7" />
            </View>
            <View style={styles.topInfo}>
              <Text style={styles.topTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.topSubtitle}>{item.subtitle}</Text>
              <Text style={styles.topDate}>{item.date_formatted}</Text>
            </View>
          </View>
          {details.is_emergency && (
            <View style={styles.emergencyBadge}>
              <Ionicons name="alert-circle" size={14} color="#DC2626" />
              <Text style={styles.emergencyText}>Emergency Visit</Text>
            </View>
          )}
        </Card>

        {/* Doctor Info */}
        <Card style={styles.sectionCard} variant="elevated">
          <Text style={styles.sectionTitle}>Attending Doctor</Text>
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

        {/* Chief Complaint */}
        {details.chief_complaint && (
          <Card style={styles.sectionCard} variant="elevated">
            <Text style={styles.sectionTitle}>Chief Complaint</Text>
            <Text style={styles.bodyText}>{details.chief_complaint}</Text>
          </Card>
        )}

        {/* History of Present Illness */}
        {details.history_of_present_illness && (
          <Card style={styles.sectionCard} variant="elevated">
            <Text style={styles.sectionTitle}>History of Present Illness</Text>
            <Text style={styles.bodyText}>{details.history_of_present_illness}</Text>
          </Card>
        )}

        {/* Past Medical History */}
        {details.past_medical_history && (
          <Card style={styles.sectionCard} variant="elevated">
            <Text style={styles.sectionTitle}>Past Medical History</Text>
            <Text style={styles.bodyText}>{details.past_medical_history}</Text>
          </Card>
        )}

        {/* Current Medications & Allergies */}
        {(details.current_medications || details.allergies) && (
          <Card style={styles.sectionCard} variant="elevated">
            {details.current_medications && (
              <>
                <Text style={styles.sectionTitle}>Current Medications</Text>
                <Text style={[styles.bodyText, { marginBottom: details.allergies ? SPACING.md : 0 }]}>
                  {details.current_medications}
                </Text>
              </>
            )}
            {details.allergies && (
              <>
                <Text style={styles.sectionTitle}>Allergies</Text>
                <View style={styles.allergyRow}>
                  <Ionicons name="warning-outline" size={16} color="#DC2626" />
                  <Text style={[styles.bodyText, { color: '#DC2626' }]}>{details.allergies}</Text>
                </View>
              </>
            )}
          </Card>
        )}

        {/* Family & Social History */}
        {(details.family_history || details.social_history) && (
          <Card style={styles.sectionCard} variant="elevated">
            {details.family_history && (
              <>
                <Text style={styles.sectionTitle}>Family History</Text>
                <Text style={[styles.bodyText, { marginBottom: details.social_history ? SPACING.md : 0 }]}>
                  {details.family_history}
                </Text>
              </>
            )}
            {details.social_history && (
              <>
                <Text style={styles.sectionTitle}>Social History</Text>
                <Text style={styles.bodyText}>{details.social_history}</Text>
              </>
            )}
          </Card>
        )}

        {/* Vital Signs */}
        {hasVitals && (
          <Card style={styles.sectionCard} variant="elevated">
            <Text style={styles.sectionTitle}>Vital Signs</Text>
            <View style={styles.vitalsGrid}>
              {vitals?.bloodPressure ? (
                <View style={styles.vitalItem}>
                  <Ionicons name="heart-outline" size={18} color="#DC2626" />
                  <Text style={styles.vitalLabel}>Blood Pressure</Text>
                  <Text style={styles.vitalValue}>{vitals.bloodPressure} mmHg</Text>
                </View>
              ) : null}
              {vitals?.heartRate ? (
                <View style={styles.vitalItem}>
                  <Ionicons name="pulse-outline" size={18} color="#E11D48" />
                  <Text style={styles.vitalLabel}>Heart Rate</Text>
                  <Text style={styles.vitalValue}>{vitals.heartRate} bpm</Text>
                </View>
              ) : null}
              {vitals?.temperature ? (
                <View style={styles.vitalItem}>
                  <Ionicons name="thermometer-outline" size={18} color="#D97706" />
                  <Text style={styles.vitalLabel}>Temperature</Text>
                  <Text style={styles.vitalValue}>{vitals.temperature} °C</Text>
                </View>
              ) : null}
              {vitals?.respiratoryRate ? (
                <View style={styles.vitalItem}>
                  <Ionicons name="leaf-outline" size={18} color="#059669" />
                  <Text style={styles.vitalLabel}>Resp. Rate</Text>
                  <Text style={styles.vitalValue}>{vitals.respiratoryRate} /min</Text>
                </View>
              ) : null}
              {vitals?.oxygenSaturation ? (
                <View style={styles.vitalItem}>
                  <Ionicons name="water-outline" size={18} color="#2563EB" />
                  <Text style={styles.vitalLabel}>O₂ Saturation</Text>
                  <Text style={styles.vitalValue}>{vitals.oxygenSaturation}%</Text>
                </View>
              ) : null}
            </View>
          </Card>
        )}

        {/* Physical Examination */}
        {details.physical_examination && (
          <Card style={styles.sectionCard} variant="elevated">
            <Text style={styles.sectionTitle}>Physical Examination</Text>
            <Text style={styles.bodyText}>{details.physical_examination}</Text>
          </Card>
        )}

        {/* Clinical Notes */}
        {details.clinical_notes && (
          <Card style={styles.sectionCard} variant="elevated">
            <Text style={styles.sectionTitle}>Clinical Notes</Text>
            <Text style={styles.bodyText}>{details.clinical_notes}</Text>
          </Card>
        )}

        {/* Diagnosis */}
        {details.diagnosis && (
          <Card style={[styles.sectionCard, styles.diagnosisCard]} variant="elevated">
            <Text style={styles.sectionTitle}>Diagnosis</Text>
            <Text style={[styles.bodyText, styles.diagnosisText]}>{details.diagnosis}</Text>
          </Card>
        )}

        {/* Treatment Plan */}
        {details.treatment_plan && (
          <Card style={styles.sectionCard} variant="elevated">
            <Text style={styles.sectionTitle}>Treatment Plan</Text>
            <Text style={styles.bodyText}>{details.treatment_plan}</Text>
          </Card>
        )}

        {/* Follow-up Instructions */}
        {details.follow_up_instructions && (
          <Card style={styles.sectionCard} variant="elevated">
            <Text style={styles.sectionTitle}>Follow-up Instructions</Text>
            <Text style={styles.bodyText}>{details.follow_up_instructions}</Text>
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
  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DC262610',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
  },
  emergencyText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: '#DC2626',
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
  allergyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  vitalItem: {
    width: '47%',
    backgroundColor: COLORS.backgroundDark,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    gap: 4,
  },
  vitalLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  vitalValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  diagnosisCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#0284C7',
  },
  diagnosisText: {
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.base,
  },
});
