import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Switch,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { Button, Input, Card } from '../components';
import medicalRecordsService from '../services/medicalRecordsService';

const RECORD_TYPES = [
  { value: 'lab_result', label: 'Lab Result', icon: 'flask-outline', color: '#7C3AED', description: 'Blood tests, urine tests, etc.' },
  { value: 'prescription', label: 'Prescription', icon: 'document-text-outline', color: '#059669', description: 'Medication prescriptions' },
  { value: 'discharge_summary', label: 'Discharge Summary', icon: 'clipboard-outline', color: '#2563EB', description: 'Hospital discharge documents' },
  { value: 'imaging', label: 'Imaging / Scan', icon: 'scan-outline', color: '#D97706', description: 'X-rays, MRIs, CT scans' },
  { value: 'vaccination', label: 'Vaccination Record', icon: 'medkit-outline', color: '#DC2626', description: 'Vaccination certificates' },
  { value: 'allergy_report', label: 'Allergy Report', icon: 'alert-circle-outline', color: '#E11D48', description: 'Allergy test results' },
  { value: 'other', label: 'Other', icon: 'folder-outline', color: '#6B7280', description: 'Other medical documents' },
];

export default function AddMedicalRecordScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [providerName, setProviderName] = useState('');
  const [notes, setNotes] = useState('');
  const [recordDate, setRecordDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [shareWithMedics, setShareWithMedics] = useState(true);
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    type: string;
    size?: number;
  } | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size,
        });
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('Required', 'Please select a record type.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title for this record.');
      return;
    }
    if (!selectedFile) {
      Alert.alert('Required', 'Please select a file to upload.');
      return;
    }

    setUploading(true);
    try {
      await medicalRecordsService.uploadRecord({
        record_type: selectedType,
        title: title.trim(),
        description: description.trim() || undefined,
        file: {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.type,
        },
        record_date: recordDate ? recordDate.toISOString().split('T')[0] : undefined,
        provider_name: providerName.trim() || undefined,
        notes: notes.trim() || undefined,
        share_with_medics: shareWithMedics,
      });

      Alert.alert('Success', 'Medical record uploaded successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().join('\n')
          : 'Failed to upload record. Please try again.';
      Alert.alert('Upload Failed', message);
    } finally {
      setUploading(false);
    }
  };

  const renderTypeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Record Type *</Text>
      <View style={styles.typeGrid}>
        {RECORD_TYPES.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.typeCard,
              selectedType === type.value && styles.typeCardSelected,
              selectedType === type.value && { borderColor: type.color },
            ]}
            onPress={() => setSelectedType(type.value)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.typeIconWrap,
                { backgroundColor: type.color + '15' },
                selectedType === type.value && { backgroundColor: type.color + '25' },
              ]}
            >
              <Ionicons name={type.icon as any} size={22} color={type.color} />
            </View>
            <Text
              style={[
                styles.typeLabel,
                selectedType === type.value && { color: type.color, fontWeight: TYPOGRAPHY.fontWeight.bold },
              ]}
              numberOfLines={2}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Record</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Record Type */}
          {renderTypeSelector()}

          {/* File Upload */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>File *</Text>
            {selectedFile ? (
              <Card style={styles.fileCard} variant="outlined">
                <View style={styles.fileInfo}>
                  <View style={styles.fileIconWrap}>
                    <Ionicons
                      name={
                        selectedFile.type.includes('pdf')
                          ? 'document-outline'
                          : selectedFile.type.includes('image')
                          ? 'image-outline'
                          : 'document-attach-outline'
                      }
                      size={28}
                      color={COLORS.primary}
                    />
                  </View>
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                    <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.fileRemove}
                    onPress={() => setSelectedFile(null)}
                  >
                    <Ionicons name="close-circle" size={22} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </Card>
            ) : (
              <TouchableOpacity style={styles.uploadArea} onPress={handlePickFile} activeOpacity={0.7}>
                <View style={styles.uploadIconWrap}>
                  <Ionicons name="cloud-upload-outline" size={36} color={COLORS.primary} />
                </View>
                <Text style={styles.uploadTitle}>Tap to select a file</Text>
                <Text style={styles.uploadSubtitle}>
                  PDF, JPG, PNG, DOC up to 10MB
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Input
              label="Title *"
              placeholder="e.g. Blood Test Results - Jan 2026"
              value={title}
              onChangeText={setTitle}
              leftIcon="text-outline"
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Input
              label="Description"
              placeholder="Brief description of the record"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={{ height: 80 }}
            />
          </View>

          {/* Record Date */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Record Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={COLORS.textSecondary} />
              <Text style={[styles.dateText, !recordDate && styles.datePlaceholder]}>
                {recordDate
                  ? recordDate.toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'When was this record created?'}
              </Text>
              {recordDate && (
                <TouchableOpacity onPress={() => setRecordDate(null)}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={recordDate || new Date()}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) setRecordDate(date);
                }}
              />
            )}
          </View>

          {/* Provider */}
          <View style={styles.section}>
            <Input
              label="Healthcare Provider"
              placeholder="e.g. Nairobi Hospital, Lancet Lab"
              value={providerName}
              onChangeText={setProviderName}
              leftIcon="business-outline"
            />
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Input
              label="Your Notes"
              placeholder="Any personal notes about this record"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              style={{ height: 80 }}
            />
          </View>

          {/* Share Toggle */}
          <Card style={styles.shareCard} variant="outlined">
            <View style={styles.shareRow}>
              <View style={styles.shareInfo}>
                <View style={styles.shareIconWrap}>
                  <Ionicons
                    name={shareWithMedics ? 'shield-checkmark-outline' : 'lock-closed-outline'}
                    size={22}
                    color={shareWithMedics ? COLORS.success : COLORS.textSecondary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.shareTitle}>Share with Medics</Text>
                  <Text style={styles.shareSubtitle}>
                    {shareWithMedics
                      ? 'This record will be visible to your doctor during consultations'
                      : 'This record will be kept private'}
                  </Text>
                </View>
              </View>
              <Switch
                value={shareWithMedics}
                onValueChange={setShareWithMedics}
                trackColor={{ false: COLORS.border, true: COLORS.success }}
                thumbColor={COLORS.white}
              />
            </View>
          </Card>

          {/* Submit */}
          <View style={styles.submitSection}>
            <Button
              title={uploading ? 'Uploading...' : 'Upload Record'}
              onPress={handleSubmit}
              loading={uploading}
              disabled={!selectedType || !title.trim() || !selectedFile || uploading}
              fullWidth
              size="lg"
              icon={
                !uploading ? (
                  <Ionicons name="cloud-upload-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                ) : undefined
              }
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  typeCard: {
    width: '30.5%',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  typeCardSelected: {
    borderWidth: 2,
    backgroundColor: COLORS.white,
    ...SHADOWS.md,
  },
  typeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  typeLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  uploadArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['2xl'],
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
    borderStyle: 'dashed',
    backgroundColor: COLORS.primary + '05',
  },
  uploadIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  uploadTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  uploadSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  fileCard: {
    padding: SPACING.md,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIconWrap: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  fileSize: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  fileRemove: {
    padding: SPACING.xs,
  },
  fieldLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  dateText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textPrimary,
  },
  datePlaceholder: {
    color: COLORS.textTertiary,
  },
  shareCard: {
    marginBottom: SPACING.xl,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shareInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.md,
  },
  shareIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  shareTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  shareSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  submitSection: {
    marginTop: SPACING.sm,
  },
});
