import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { authService, type RegisterRequest } from '../services/authService';
import { validateEmail, validatePhone, validatePassword, validateName, validatePasswordMatch } from '../utils/validation';
import { parseAuthError, formatErrorMessage, isEmailAlreadyExistsError, isPhoneAlreadyExistsError } from '../utils/authHelpers';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

export default function RegisterScreen({ navigation }: any) {
  const [form, setForm] = useState<RegisterRequest>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirmation: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterRequest, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { setAuth } = useAuthStore();

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    const firstNameValidation = validateName(form.firstName, 'First name');
    if (!firstNameValidation.valid) {
      newErrors.firstName = firstNameValidation.error;
    }

    const lastNameValidation = validateName(form.lastName, 'Last name');
    if (!lastNameValidation.valid) {
      newErrors.lastName = lastNameValidation.error;
    }

    const emailValidation = validateEmail(form.email);
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.error;
    }

    const phoneValidation = validatePhone(form.phone);
    if (!phoneValidation.valid) {
      newErrors.phone = phoneValidation.error;
    }

    const passwordValidation = validatePassword(form.password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.error;
    }

    const passwordMatchValidation = validatePasswordMatch(form.password, form.passwordConfirmation);
    if (!passwordMatchValidation.valid) {
      newErrors.passwordConfirmation = passwordMatchValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.register(form);
      if (response.success) {
        // Navigate to verification pending screen instead of auto-login
        navigation.replace('VerificationPending', { email: form.email });
      } else {
        Alert.alert('Registration Failed', response.message || 'Unable to register');
      }
    } catch (error: any) {
      if (isEmailAlreadyExistsError(error)) {
        setErrors({ email: 'This email is already registered. Please login instead.' });
      } else if (isPhoneAlreadyExistsError(error)) {
        setErrors({ phone: 'This phone number is already registered. Please login instead.' });
      } else {
        const authError = parseAuthError(error);
        const message = formatErrorMessage(authError);
        Alert.alert('Registration Failed', message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof RegisterRequest, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const renderInputField = (
    label: string,
    field: keyof RegisterRequest,
    placeholder: string,
    keyboardType: 'default' | 'email-address' | 'phone-pad' = 'default',
    icon: keyof typeof Ionicons.glyphMap = 'person-outline',
    secureTextEntry: boolean = false,
    showToggle: boolean = false,
    toggleState?: boolean,
    onToggle?: () => void
  ) => (
    <View style={{ marginBottom: SPACING.lg }}>
      <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: SPACING.sm, color: COLORS.textPrimary }}>
        {label}
      </Text>
      <View style={{
        borderWidth: 1,
        borderColor: errors[field] ? COLORS.error : COLORS.border,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        backgroundColor: COLORS.white,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <Ionicons name={icon} size={20} color={COLORS.textSecondary} style={{ marginRight: SPACING.sm }} />
        <TextInput
          placeholder={placeholder}
          value={form[field]}
          onChangeText={(v) => updateField(field, v)}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
          secureTextEntry={secureTextEntry && !toggleState}
          editable={!isLoading}
          style={{ flex: 1, paddingVertical: SPACING.md, fontSize: 16, color: COLORS.textPrimary }}
        />
        {showToggle && (
          <TouchableOpacity onPress={onToggle}>
            <Ionicons name={toggleState ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {errors[field] && (
        <Text style={{ fontSize: 12, color: COLORS.error, marginTop: SPACING.xs }}>
          {errors[field]}
        </Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: SPACING.lg, backgroundColor: COLORS.background }}>
        <View style={{ marginBottom: SPACING.xl * 2, marginTop: SPACING.lg }}>
          <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: SPACING.md, textAlign: 'center', color: COLORS.textPrimary }}>
            Create Account
          </Text>
          <Text style={{ fontSize: 16, marginBottom: SPACING.lg, textAlign: 'center', color: COLORS.textSecondary }}>
            Join MediConnect to request medical services
          </Text>
        </View>

        {renderInputField('First Name', 'firstName', 'John', 'default', 'person-outline')}
        {renderInputField('Last Name', 'lastName', 'Doe', 'default', 'person-outline')}
        {renderInputField('Email', 'email', 'john@example.com', 'email-address', 'mail-outline')}
        {renderInputField('Phone Number', 'phone', '+1234567890', 'phone-pad', 'call-outline')}
        {renderInputField(
          'Password',
          'password',
          'At least 8 characters',
          'default',
          'lock-closed-outline',
          true,
          true,
          showPassword,
          () => setShowPassword(!showPassword)
        )}
        {renderInputField(
          'Confirm Password',
          'passwordConfirmation',
          'Confirm your password',
          'default',
          'lock-closed-outline',
          true,
          true,
          showConfirmPassword,
          () => setShowConfirmPassword(!showConfirmPassword)
        )}

        <View style={{ marginBottom: SPACING.lg, padding: SPACING.md, backgroundColor: '#E8F4F8', borderRadius: BORDER_RADIUS.md }}>
          <Text style={{ fontSize: 12, color: COLORS.info, lineHeight: 18 }}>
            <Ionicons name="information-circle" size={14} color={COLORS.info} /> Password must contain at least 8 characters, including uppercase, lowercase, and numbers.
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleRegister}
          disabled={isLoading}
          style={{
            backgroundColor: isLoading ? COLORS.textDisabled : COLORS.primary,
            paddingVertical: SPACING.md,
            borderRadius: BORDER_RADIUS.md,
            alignItems: 'center',
            marginBottom: SPACING.lg,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '600' }}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: '600' }}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
