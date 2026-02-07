import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { authService, type RegisterRequest } from '../services/authService';
import { validateEmail, validatePhone, validatePassword, validateName } from '../utils/validation';

export default function EnhancedRegisterScreen({ navigation }: any) {
  const [form, setForm] = useState<RegisterRequest>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirmation: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirmation: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const { setAuth } = useAuthStore();

  const updateField = (field: keyof RegisterRequest, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      passwordConfirmation: '',
    };
    let isValid = true;

    if (!validateName(form.firstName)) {
      newErrors.firstName = 'First name must be at least 2 characters';
      isValid = false;
    }

    if (!validateName(form.lastName)) {
      newErrors.lastName = 'Last name must be at least 2 characters';
      isValid = false;
    }

    if (!validateEmail(form.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!validatePhone(form.phone)) {
      newErrors.phone = 'Please enter a valid Kenyan phone number';
      isValid = false;
    }

    const passwordValidation = validatePassword(form.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0];
      isValid = false;
    }

    if (form.password !== form.passwordConfirmation) {
      newErrors.passwordConfirmation = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.register(form);
      if (response.success && response.user && response.token) {
        await setAuth(response.user, response.token);
        Alert.alert('Success', 'Account created successfully!', [
          { text: 'OK', onPress: () => navigation.replace('Main') },
        ]);
      } else {
        Alert.alert('Registration Failed', response.message);
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error.message || 'Something went wrong';
      Alert.alert('Registration Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started with MediConnect</Text>

            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <View style={[styles.inputContainer, errors.firstName && styles.inputError]}>
                  <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    placeholder="First Name"
                    value={form.firstName}
                    onChangeText={(v) => updateField('firstName', v)}
                    style={styles.input}
                    editable={!isLoading}
                  />
                </View>
                {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
              </View>

              <View style={styles.inputWrapper}>
                <View style={[styles.inputContainer, errors.lastName && styles.inputError]}>
                  <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Last Name"
                    value={form.lastName}
                    onChangeText={(v) => updateField('lastName', v)}
                    style={styles.input}
                    editable={!isLoading}
                  />
                </View>
                {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
              </View>

              <View style={styles.inputWrapper}>
                <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                  <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Email Address"
                    value={form.email}
                    onChangeText={(v) => updateField('email', v)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                    editable={!isLoading}
                  />
                </View>
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
              </View>

              <View style={styles.inputWrapper}>
                <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                  <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Phone Number (07XX XXX XXX)"
                    value={form.phone}
                    onChangeText={(v) => updateField('phone', v)}
                    keyboardType="phone-pad"
                    style={styles.input}
                    editable={!isLoading}
                  />
                </View>
                {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
              </View>

              <View style={styles.inputWrapper}>
                <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                  <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Password"
                    value={form.password}
                    onChangeText={(v) => updateField('password', v)}
                    secureTextEntry={!showPassword}
                    style={styles.input}
                    editable={!isLoading}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
                {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
              </View>

              <View style={styles.inputWrapper}>
                <View style={[styles.inputContainer, errors.passwordConfirmation && styles.inputError]}>
                  <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Confirm Password"
                    value={form.passwordConfirmation}
                    onChangeText={(v) => updateField('passwordConfirmation', v)}
                    secureTextEntry={!showConfirmPassword}
                    style={styles.input}
                    editable={!isLoading}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons
                      name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
                {errors.passwordConfirmation ? (
                  <Text style={styles.errorText}>{errors.passwordConfirmation}</Text>
                ) : null}
              </View>

              <View style={styles.passwordRequirements}>
                <Text style={styles.requirementsTitle}>Password must contain:</Text>
                <Text style={styles.requirementText}>• At least 8 characters</Text>
                <Text style={styles.requirementText}>• One uppercase letter</Text>
                <Text style={styles.requirementText}>• One lowercase letter</Text>
                <Text style={styles.requirementText}>• One number</Text>
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>Log In</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.termsText}>
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  form: {
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    color: '#1a1a1a',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 16,
  },
  passwordRequirements: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  linkText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#999',
    marginTop: 16,
    lineHeight: 18,
  },
});
