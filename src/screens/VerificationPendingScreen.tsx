import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

interface Props {
  navigation: any;
  route: {
    params?: {
      email?: string;
    };
  };
}

export default function VerificationPendingScreen({ navigation, route }: Props) {
  const email = route.params?.email || '';

  const handleGoToLogin = () => {
    navigation.replace('Login');
  };

  const handleResendVerification = () => {
    // TODO: Implement resend verification email API call
    // For now, just show that it would resend
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="mail-unread-outline" size={80} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Verify Your Email</Text>

        <Text style={styles.subtitle}>
          We've sent a verification link to:
        </Text>

        {email ? (
          <Text style={styles.email}>{email}</Text>
        ) : null}

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructions}>
            Please check your email and click the verification link to activate your account.
          </Text>
          <Text style={styles.instructions}>
            You must verify your email before you can log in.
          </Text>
        </View>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Didn't receive the email?</Text>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.tipText}>Check your spam or junk folder</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.tipText}>Make sure you entered the correct email</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.tipText}>Wait a few minutes and try again</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleGoToLogin}>
          <Text style={styles.loginButtonText}>Go to Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resendButton} onPress={handleResendVerification}>
          <Text style={styles.resendButtonText}>Resend Verification Email</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E8F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  instructionsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  instructions: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  tipsContainer: {
    backgroundColor: '#FFF9E6',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: '#F0E6CC',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  tipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl * 2,
    borderRadius: BORDER_RADIUS.md,
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    paddingVertical: SPACING.md,
  },
  resendButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
