import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { validatePhone } from '../utils/validation';
import { parseAuthError, formatErrorMessage } from '../utils/authHelpers';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

export default function GooglePhoneScreen({ route, navigation }: any) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  
  const { email, name, googleId } = route.params;

  const handleSubmit = async () => {
    if (!phone) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (!validatePhone(phone)) {
      Alert.alert('Error', 'Please enter a valid phone number (10 digits or with country code)');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.verifyGooglePhone({
        email,
        phone,
        google_id: googleId
      });
      
      await login(result.token, result.user);
    } catch (error: any) {
      const errorMessage = parseAuthError(error);
      Alert.alert('Phone Verification Failed', formatErrorMessage(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="call-outline" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Hi {name}, we need your phone number to complete your registration
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color={COLORS.info} />
            <Text style={styles.infoText}>
              Your phone number is required for appointment confirmations and emergency contacts
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number (e.g., 0712345678)"
              placeholderTextColor={COLORS.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={15}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Complete Registration</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  backButton: {
    padding: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl * 2,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  form: {
    width: '100%',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.info + '10',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xl,
  },
  infoText: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 14,
    color: COLORS.info,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
    height: 56,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
};
