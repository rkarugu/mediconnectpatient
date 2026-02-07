import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GOOGLE_ANDROID_CLIENT_ID, GOOGLE_EXPO_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '../config/googleAuth';
import { validateEmail, validatePhone, isEmailOrPhone } from '../utils/validation';
import { parseAuthError, formatErrorMessage } from '../utils/authHelpers';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setAuth } = useAuthStore();

  // Only initialize Google auth if client IDs are configured
  const googleAuthEnabled = !!(GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID);
  
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    googleAuthEnabled ? {
      clientId: GOOGLE_WEB_CLIENT_ID || undefined,
      iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
      androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
      webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    } : { clientId: 'placeholder' } // Placeholder to prevent crash when not configured
  );

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSignIn(response.params.id_token);
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken: string) => {
    try {
      setLoading(true);
      const result = await authService.googleLogin({ idToken });
      
      if (result.user.phone_verified === false) {
        navigation.navigate('GooglePhone', { 
          email: result.user.email,
          name: result.user.name,
          googleId: result.user.google_id 
        });
      } else {
        await setAuth(result.user, result.token);
      }
    } catch (error: any) {
      const errorMessage = parseAuthError(error);
      Alert.alert('Google Sign In Failed', formatErrorMessage(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email/phone and password');
      return;
    }

    const inputType = isEmailOrPhone(email);
    if (!inputType) {
      Alert.alert('Error', 'Please enter a valid email address or phone number');
      return;
    }

    if (inputType === 'email' && !validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (inputType === 'phone' && !validatePhone(email)) {
      Alert.alert('Error', 'Please enter a valid phone number (10 digits or with country code)');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.login({ 
        identifier: email, 
        password 
      });
      await setAuth(result.user, result.token);
    } catch (error: any) {
      const errorMessage = parseAuthError(error);
      Alert.alert('Login Failed', formatErrorMessage(errorMessage));
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
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email or Phone Number"
              placeholderTextColor={COLORS.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={COLORS.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color={COLORS.textSecondary} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {googleAuthEnabled && (
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>
          )}

          {googleAuthEnabled && (
            <TouchableOpacity
              style={styles.googleButton}
              onPress={() => promptAsync()}
              disabled={!request || loading}
            >
              <Ionicons name="logo-google" size={20} color={COLORS.textPrimary} />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
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
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl * 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
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
  eyeIcon: {
    padding: SPACING.xs,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xl,
  },
  googleButtonText: {
    marginLeft: SPACING.sm,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
};
