import React from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const MC_LOGO = require('../../assets/mediconnect logo.png');

export default function SplashScreen() {
  return (
    <LinearGradient colors={['#1A6FAE', '#2B7BB9', '#3A9BD5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <View style={styles.logoWrap}>
        <Image source={MC_LOGO} style={styles.logo} resizeMode="contain" />
      </View>
      <Text style={styles.title}>MediConnect</Text>
      <ActivityIndicator size="large" color="rgba(255,255,255,0.8)" style={styles.loader} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrap: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 90,
    height: 90,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    letterSpacing: 2,
  },
  loader: {
    marginTop: 40,
  },
});
