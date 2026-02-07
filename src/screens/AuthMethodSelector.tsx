import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthMethodSelector({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text style={styles.title}>Welcome to MediConnect</Text>
        <Text style={styles.subtitle}>
          Choose your preferred way to sign in or create an account
        </Text>

        <View style={styles.methodsContainer}>
          <TouchableOpacity
            style={[styles.methodButton, styles.googleButton]}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="logo-google" size={24} color="#fff" />
            <Text style={styles.methodButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodButton, styles.phoneButton]}
            onPress={() => navigation.navigate('PhoneAuth')}
          >
            <Ionicons name="call" size={24} color="#fff" />
            <Text style={styles.methodButtonText}>Continue with Phone</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodButton, styles.emailButton]}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="mail" size={24} color="#fff" />
            <Text style={styles.methodButtonText}>Continue with Email</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerButtonText}>Create New Account</Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
    lineHeight: 24,
  },
  methodsContainer: {
    marginBottom: 24,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  googleButton: {
    backgroundColor: '#DB4437',
  },
  phoneButton: {
    backgroundColor: '#34A853',
  },
  emailButton: {
    backgroundColor: '#4285F4',
  },
  methodButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  registerButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#999',
    marginTop: 24,
    lineHeight: 18,
  },
});
