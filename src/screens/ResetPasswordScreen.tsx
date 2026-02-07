import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../services/authService';
import { validatePassword, validatePasswordMatch } from '../utils/validation';
import { parseAuthError, formatErrorMessage } from '../utils/authHelpers';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

export default function ResetPasswordScreen({ navigation, route }: any) {
  const { email, token } = route?.params ?? {};
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!email || !token) {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: SPACING.base, backgroundColor: COLORS.background }}>
        <View style={{ alignItems: 'center' }}>
          <Ionicons name="alert-circle" size={60} color={COLORS.error} style={{ marginBottom: SPACING.lg }} />
          <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: SPACING.md, textAlign: 'center', color: COLORS.textPrimary }}>
            Invalid Reset Link
          </Text>
          <Text style={{ fontSize: 14, marginBottom: SPACING['2xl'], textAlign: 'center', color: COLORS.textSecondary }}>
            The password reset link is invalid or has expired.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.replace('ForgotPassword')}
            style={{
              backgroundColor: COLORS.primary,
              paddingVertical: SPACING.base,
              paddingHorizontal: SPACING['2xl'],
              borderRadius: BORDER_RADIUS.base,
            }}
          >
            <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '600' }}>Request New Link</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.error;
    }

    const matchValidation = validatePasswordMatch(password, confirmPassword);
    if (!matchValidation.valid) {
      newErrors.confirmPassword = matchValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.resetPassword({
        email,
        password,
        token,
      });
      if (response.success) {
        setSuccess(true);
        Alert.alert('Success', 'Your password has been reset successfully');
        setTimeout(() => {
          navigation.replace('Login');
        }, 2000);
      } else {
        Alert.alert('Error', response.message || 'Unable to reset password');
      }
    } catch (error: any) {
      const authError = parseAuthError(error);
      const message = formatErrorMessage(authError);
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: SPACING.base, backgroundColor: COLORS.background }}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.secondaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING['2xl'] }}>
            <Ionicons name="checkmark-circle" size={60} color={COLORS.secondary} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: SPACING.md, textAlign: 'center', color: COLORS.textPrimary }}>
            Password Reset
          </Text>
          <Text style={{ fontSize: 16, marginBottom: SPACING['2xl'], textAlign: 'center', color: COLORS.textSecondary }}>
            Your password has been successfully reset. You can now login with your new password.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: SPACING.base, backgroundColor: COLORS.background }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: SPACING.lg }}>
          <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>

        <View style={{ marginBottom: SPACING['2xl'] }}>
          <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: SPACING.md, textAlign: 'center', color: COLORS.textPrimary }}>
            Create New Password
          </Text>
          <Text style={{ fontSize: 16, marginBottom: SPACING.lg, textAlign: 'center', color: COLORS.textSecondary }}>
            Enter a strong password to secure your account.
          </Text>
        </View>

        <View style={{ marginBottom: SPACING.lg }}>
          <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: SPACING.sm, color: COLORS.textPrimary }}>
            New Password
          </Text>
          <View style={{
            borderWidth: 1,
            borderColor: errors.password ? COLORS.error : COLORS.border,
            borderRadius: BORDER_RADIUS.base,
            paddingHorizontal: SPACING.base,
            backgroundColor: COLORS.white,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={{ marginRight: SPACING.sm }} />
            <TextInput
              placeholder="At least 8 characters"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              secureTextEntry={!showPassword}
              editable={!isLoading}
              style={{ flex: 1, paddingVertical: SPACING.base, fontSize: 16, color: COLORS.textPrimary }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <Text style={{ fontSize: 12, color: COLORS.error, marginTop: SPACING.sm }}>
              {errors.password}
            </Text>
          )}
        </View>

        <View style={{ marginBottom: SPACING['2xl'] }}>
          <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: SPACING.sm, color: COLORS.textPrimary }}>
            Confirm Password
          </Text>
          <View style={{
            borderWidth: 1,
            borderColor: errors.confirmPassword ? COLORS.error : COLORS.border,
            borderRadius: BORDER_RADIUS.base,
            paddingHorizontal: SPACING.base,
            backgroundColor: COLORS.white,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={{ marginRight: SPACING.sm }} />
            <TextInput
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
              }}
              secureTextEntry={!showConfirmPassword}
              editable={!isLoading}
              style={{ flex: 1, paddingVertical: SPACING.base, fontSize: 16, color: COLORS.textPrimary }}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && (
            <Text style={{ fontSize: 12, color: COLORS.error, marginTop: SPACING.sm }}>
              {errors.confirmPassword}
            </Text>
          )}
        </View>

        <View style={{ marginBottom: SPACING.lg, padding: SPACING.base, backgroundColor: '#E8F4F8', borderRadius: BORDER_RADIUS.base }}>
          <Text style={{ fontSize: 12, color: COLORS.info, lineHeight: 18 }}>
            <Ionicons name="information-circle" size={14} color={COLORS.info} /> Password must contain at least 8 characters, including uppercase, lowercase, and numbers.
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleReset}
          disabled={isLoading}
          style={{
            backgroundColor: isLoading ? COLORS.textDisabled : COLORS.primary,
            paddingVertical: SPACING.base,
            borderRadius: BORDER_RADIUS.base,
            alignItems: 'center',
          }}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '600' }}>Reset Password</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
