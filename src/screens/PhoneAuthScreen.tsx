import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { phoneAuthService } from '../services/phoneAuthService';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { validatePhone, formatPhoneNumber } from '../utils/validation';
import { auth } from '../config/firebase';

export default function PhoneAuthScreen({ navigation }: any) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verificationId, setVerificationId] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { setAuth } = useAuthStore();
  const otpInputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (step === 'otp' && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, timer]);

  const handleSendOTP = async () => {
    if (!validatePhone(phoneNumber)) {
      Alert.alert('Invalid Phone', 'Please enter a valid Kenyan phone number');
      return;
    }

    if (!auth) {
      Alert.alert(
        'Configuration Error',
        'Firebase is not configured. Please add Firebase credentials to .env file.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const result = await phoneAuthService.sendOTP(formattedPhone);

      if (result.success && result.verificationId) {
        setVerificationId(result.verificationId);
        setStep('otp');
        setTimer(60);
        setCanResend(false);
        Alert.alert('OTP Sent', `Verification code sent to ${formattedPhone}`);
      } else {
        Alert.alert('Error', result.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const result = await phoneAuthService.verifyOTP(verificationId, otpCode);

      if (result.success && result.phoneNumber) {
        const firebaseUser = auth?.currentUser;
        if (firebaseUser) {
          const firebaseToken = await firebaseUser.getIdToken();
          
          const authResponse = await authService.phoneLogin({
            phone: result.phoneNumber,
            firebaseToken,
          });

          if (authResponse.success && authResponse.user && authResponse.token) {
            await setAuth(authResponse.user, authResponse.token);
            navigation.replace('Main');
          } else {
            Alert.alert('Login Failed', authResponse.message);
          }
        }
      } else {
        Alert.alert('Verification Failed', result.message || 'Invalid OTP');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    setOtp(['', '', '', '', '', '']);
    await handleSendOTP();
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      value = value[0];
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('phone');
      setOtp(['', '', '', '', '', '']);
      setVerificationId('');
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {step === 'phone' ? 'Phone Number' : 'Verify OTP'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {step === 'phone' ? (
            <>
              <Ionicons name="call" size={64} color="#007AFF" style={styles.icon} />
              <Text style={styles.title}>Enter Your Phone Number</Text>
              <Text style={styles.subtitle}>
                We'll send you a verification code to confirm your number
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.prefix}>+254</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="7XX XXX XXX"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={15}
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSendOTP}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send Code</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Ionicons name="mail" size={64} color="#007AFF" style={styles.icon} />
              <Text style={styles.title}>Enter Verification Code</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code sent to {formatPhoneNumber(phoneNumber)}
              </Text>

              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (otpInputs.current[index] = ref)}
                    style={styles.otpInput}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleOtpKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    editable={!isLoading}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleVerifyOTP}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify & Continue</Text>
                )}
              </TouchableOpacity>

              <View style={styles.resendContainer}>
                {canResend ? (
                  <TouchableOpacity onPress={handleResendOTP}>
                    <Text style={styles.resendText}>Resend Code</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.timerText}>Resend in {timer}s</Text>
                )}
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
      <View id="recaptcha-container" />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  prefix: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 16,
    color: '#1a1a1a',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
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
  resendContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  resendText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  timerText: {
    color: '#999',
    fontSize: 16,
  },
});
