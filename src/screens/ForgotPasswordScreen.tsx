import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../services/authService';
import { validateEmail } from '../utils/validation';
import { parseAuthError, formatErrorMessage } from '../utils/authHelpers';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [submitted, setSubmitted] = useState(false);

  const emailValidation = validateEmail(email);

  const handleSubmit = async () => {
    const validation = validateEmail(email);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      if (response.success) {
        setSubmitted(true);
        Alert.alert('Success', 'Check your email for password reset instructions');
        setTimeout(() => {
          navigation.replace('Login');
        }, 2000);
      } else {
        Alert.alert('Error', response.message || 'Unable to process request');
      }
    } catch (error: any) {
      const authError = parseAuthError(error);
      const message = formatErrorMessage(authError);
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: SPACING.base, backgroundColor: COLORS.background }}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.secondaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING['2xl'] }}>
            <Ionicons name="checkmark-circle" size={60} color={COLORS.secondary} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: SPACING.md, textAlign: 'center', color: COLORS.textPrimary }}>
            Check Your Email
          </Text>
          <Text style={{ fontSize: 16, marginBottom: SPACING['2xl'], textAlign: 'center', color: COLORS.textSecondary }}>
            We've sent password reset instructions to {email}
          </Text>
          <Text style={{ fontSize: 14, textAlign: 'center', color: COLORS.textSecondary, lineHeight: 20 }}>
            Follow the link in the email to reset your password. If you don't see the email, check your spam folder.
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
            Reset Password
          </Text>
          <Text style={{ fontSize: 16, marginBottom: SPACING.lg, textAlign: 'center', color: COLORS.textSecondary }}>
            Enter your email address and we'll send you instructions to reset your password.
          </Text>
        </View>

        <View style={{ marginBottom: SPACING['2xl'] }}>
          <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: SPACING.sm, color: COLORS.textPrimary }}>
            Email Address
          </Text>
          <View style={{
            borderWidth: 1,
            borderColor: error ? COLORS.error : COLORS.border,
            borderRadius: BORDER_RADIUS.base,
            paddingHorizontal: SPACING.base,
            backgroundColor: COLORS.white,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={{ marginRight: SPACING.sm }} />
            <TextInput
              placeholder="user@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(undefined);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
              style={{ flex: 1, paddingVertical: SPACING.base, fontSize: 16, color: COLORS.textPrimary }}
            />
          </View>
          {error && (
            <Text style={{ fontSize: 12, color: COLORS.error, marginTop: SPACING.sm }}>
              {error}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!emailValidation.valid || isLoading}
          style={{
            backgroundColor: !emailValidation.valid || isLoading ? COLORS.textDisabled : COLORS.primary,
            paddingVertical: SPACING.base,
            borderRadius: BORDER_RADIUS.base,
            alignItems: 'center',
            marginBottom: SPACING.lg,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '600' }}>Send Reset Link</Text>
          )}
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>Remember your password? </Text>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: '600' }}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
