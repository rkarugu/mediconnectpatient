import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

export default function GooglePhoneScreen({ navigation, route }: any) {
  const { idToken, email } = route?.params ?? {};
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { setAuth } = useAuthStore();

  const canSubmit = useMemo(() => Boolean(idToken) && phone.trim().length > 0, [idToken, phone]);

  const handleContinue = async () => {
    if (!idToken) {
      Alert.alert('Error', 'Missing Google token. Please try again.');
      navigation.replace('Login');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.googleLogin({ idToken, phone: phone.trim() });
      if (response.success && response.user && response.token) {
        await setAuth(response.user, response.token);
        navigation.replace('Main');
      } else {
        Alert.alert('Google Sign In Failed', response.message);
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message ?? error?.message ?? 'Something went wrong';
      Alert.alert('Google Sign In Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f5f5f5' }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>Almost done</Text>
      <Text style={{ fontSize: 14, marginBottom: 24, textAlign: 'center', color: '#666' }}>
        We need your phone number to complete your account.
      </Text>

      {!!email && (
        <Text style={{ fontSize: 14, marginBottom: 16, textAlign: 'center', color: '#444' }}>{email}</Text>
      )}

      <TextInput
        placeholder="Phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
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

      <TouchableOpacity
        onPress={handleContinue}
        disabled={!canSubmit || isLoading}
        style={{
          backgroundColor: !canSubmit || isLoading ? '#ccc' : '#007AFF',
          paddingVertical: 14,
          borderRadius: 8,
          alignItems: 'center',
        }}
      >
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Continue</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.replace('Login')} style={{ marginTop: 16 }}>
        <Text style={{ color: '#007AFF', fontSize: 14 }}>Back to login</Text>
      </TouchableOpacity>
    </View>
  );
}
