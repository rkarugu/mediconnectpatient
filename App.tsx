import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from './src/store/authStore';
import { NotificationProvider, navigationRef } from './src/providers/NotificationProvider';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import GooglePhoneScreen from './src/screens/GooglePhoneScreen';
import HomeScreen from './src/screens/HomeScreen';
import RequestScreen from './src/screens/RequestScreen';
import TrackingScreen from './src/screens/TrackingScreen';
import LiveTrackingScreen from './src/screens/LiveTrackingScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SplashScreen from './src/screens/SplashScreen';
import LabRequestsScreen from './src/screens/LabRequestsScreen';
import LabResultsScreen from './src/screens/LabResultsScreen';
import LabConsentScreen from './src/screens/LabConsentScreen';
import { COLORS } from './src/constants/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Tracking') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 15) + 10 : insets.bottom + 5,
          height: Platform.OS === 'android' ? 70 + Math.max(insets.bottom, 15) : 60 + insets.bottom,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="Tracking" 
        component={TrackingScreen}
        options={{ tabBarLabel: 'My Requests' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading, loadAuth } = useAuthStore();

  useEffect(() => {
    loadAuth();
  }, [loadAuth]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="GooglePhone" component={GooglePhoneScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Request" component={RequestScreen} />
            <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen name="Review" component={ReviewScreen} />
            <Stack.Screen name="LabRequests" component={LabRequestsScreen} />
            <Stack.Screen name="LabResults" component={LabResultsScreen} />
            <Stack.Screen name="LabConsent" component={LabConsentScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </SafeAreaProvider>
  );
}
