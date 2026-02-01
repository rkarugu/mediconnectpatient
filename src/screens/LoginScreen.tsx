import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GOOGLE_ANDROID_CLIENT_ID, GOOGLE_EXPO_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '../config/googleAuth';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }: any) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { setAuth, loadAuth } = useAuthStore();

  // Only initialize Google auth if at least one client ID is configured
  const isGoogleConfigured = Boolean(GOOGLE_EXPO_CLIENT_ID || GOOGLE_ANDROID_CLIENT_ID || GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID);
  
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest(
    isGoogleConfigured ? {
      expoClientId: GOOGLE_EXPO_CLIENT_ID || undefined,
      iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
      androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
      webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    } : {
      // Provide dummy config to prevent hook error - button will be hidden anyway
      clientId: 'not-configured',
    }
  );

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Error', 'Please enter email/phone and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login({ identifier, password });
      if (response.success && response.token && response.user) {
        await setAuth(response.user, response.token);
        // Navigate to main app (replace route)
        navigation.replace('Main');
      } else {
        Alert.alert('Login Failed', response.message);
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      if (!GOOGLE_EXPO_CLIENT_ID && !GOOGLE_ANDROID_CLIENT_ID && !GOOGLE_IOS_CLIENT_ID && !GOOGLE_WEB_CLIENT_ID) {
        Alert.alert(
          'Google not configured',
          'Missing Google client IDs. Add EXPO_PUBLIC_GOOGLE_*_CLIENT_ID env vars and restart Expo.'
        );
        return;
      }
      if (!googleRequest) {
        Alert.alert('Google Sign In Failed', 'Google request not ready. Please try again.');
        return;
      }

      setIsGoogleLoading(true);
      await googlePromptAsync({ useProxy: true });
    } catch (error: any) {
      const msg = error?.response?.data?.message ?? error?.message ?? 'Something went wrong';
      Alert.alert('Google Sign In Failed', msg);
    } finally {
      // We stop loading in the response handler below.
    }
  };

  useEffect(() => {
    const run = async () => {
      if (googleResponse?.type !== 'success') {
        if (googleResponse?.type === 'dismiss' || googleResponse?.type === 'cancel') {
          setIsGoogleLoading(false);
        }
        return;
      }

      const idToken = (googleResponse as any)?.params?.id_token as string | undefined;
      if (!idToken) {
        setIsGoogleLoading(false);
        Alert.alert('Google Sign In Failed', 'Missing id_token from Google');
        return;
      }

      try {
        const response = await authService.googleLogin({ idToken });
        if (response.success && response.user && response.token) {
          await setAuth(response.user, response.token);
          navigation.replace('Main');
          return;
        }
        Alert.alert('Google Sign In Failed', response.message || 'Unable to sign in');
      } catch (error: any) {
        const status = error?.response?.status;
        const code = error?.response?.data?.error_code;
        if (status === 422 && code === 'PHONE_REQUIRED') {
          navigation.navigate('GooglePhone', { idToken });
          return;
        }

        const msg = error?.response?.data?.message ?? error?.message ?? 'Something went wrong';
        Alert.alert('Google Sign In Failed', msg);
      } finally {
        setIsGoogleLoading(false);
      }
    };

    run();
  }, [googleResponse, navigation, setAuth]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f5f5f5' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 32, textAlign: 'center' }}>
        MediConnect Patient
      </Text>
      <Text style={{ fontSize: 16, marginBottom: 32, textAlign: 'center', color: '#666' }}>
        Login to request medical services
      </Text>

      <TextInput
        placeholder="Email or Phone Number"
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
          fontSize: 16,
        }}
        editable={!isLoading}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 8,
          padding: 12,
          marginBottom: 24,
          fontSize: 16,
        }}
        editable={!isLoading}
      />

      <TouchableOpacity
        onPress={handleLogin}
        disabled={isLoading}
        style={{
          backgroundColor: isLoading ? '#ccc' : '#007AFF',
          paddingVertical: 14,
          borderRadius: 8,
          alignItems: 'center',
        }}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Log In</Text>
        )}
      </TouchableOpacity>

      {isGoogleConfigured && (
        <TouchableOpacity
          onPress={handleGoogleLogin}
          disabled={isGoogleLoading || isLoading}
          style={{
            backgroundColor: isGoogleLoading || isLoading ? '#ccc' : '#111827',
            paddingVertical: 14,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 12,
          }}
        >
          {isGoogleLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Continue with Google</Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={() => navigation.replace('Register')}
        style={{ marginTop: 16 }}
      >
        <Text style={{ color: '#007AFF', fontSize: 14 }}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}
