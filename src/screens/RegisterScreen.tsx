import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { authService, type RegisterRequest } from '../services/authService';

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

  const { setAuth } = useAuthStore();

  const handleRegister = async () => {
    const { firstName, lastName, email, phone, password, passwordConfirmation } = form;
    if (!firstName || !lastName || !email || !phone || !password || !passwordConfirmation) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (password !== passwordConfirmation) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.register(form);
      if (response.success && response.user && response.token) {
        await setAuth(response.user, response.token);
        navigation.replace('Main');
      } else {
        Alert.alert('Registration Failed', response.message);
      }
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof RegisterRequest, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f5f5f5' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 32, textAlign: 'center' }}>
        Register
      </Text>

      <TextInput
        placeholder="First Name"
        value={form.firstName}
        onChangeText={(v) => updateField('firstName', v)}
        style={inputStyle}
        editable={!isLoading}
      />
      <TextInput
        placeholder="Last Name"
        value={form.lastName}
        onChangeText={(v) => updateField('lastName', v)}
        style={inputStyle}
        editable={!isLoading}
      />
      <TextInput
        placeholder="Email"
        value={form.email}
        onChangeText={(v) => updateField('email', v)}
        keyboardType="email-address"
        autoCapitalize="none"
        style={inputStyle}
        editable={!isLoading}
      />
      <TextInput
        placeholder="Phone"
        value={form.phone}
        onChangeText={(v) => updateField('phone', v)}
        keyboardType="phone-pad"
        style={inputStyle}
        editable={!isLoading}
      />
      <TextInput
        placeholder="Password"
        value={form.password}
        onChangeText={(v) => updateField('password', v)}
        secureTextEntry
        style={inputStyle}
        editable={!isLoading}
      />
      <TextInput
        placeholder="Confirm Password"
        value={form.passwordConfirmation}
        onChangeText={(v) => updateField('passwordConfirmation', v)}
        secureTextEntry
        style={inputStyle}
        editable={!isLoading}
      />

      <TouchableOpacity
        onPress={handleRegister}
        disabled={isLoading}
        style={{
          backgroundColor: isLoading ? '#ccc' : '#007AFF',
          paddingVertical: 14,
          borderRadius: 8,
          alignItems: 'center',
          marginTop: 24,
        }}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Register</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.replace('Login')}>
        <Text style={{ color: '#007AFF', fontSize: 14, marginTop: 16 }}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 8,
  padding: 12,
  marginBottom: 16,
  fontSize: 16,
};
