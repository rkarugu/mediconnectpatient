import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { Button, Card } from '../components';
import axios from 'axios';

const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // TODO: Add your API key

interface MedicNavigationScreenProps {
  navigation: any;
  route: any;
}

export default function MedicNavigationScreen({ navigation, route }: MedicNavigationScreenProps) {
  const { requestId, patient, destination } = route.params;
  const mapRef = useRef<MapView>(null);
  
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  
  const [routeInfo, setRouteInfo] = useState({
    distance: 0,
    duration: 0,
  });
  
  const [hasArrived, setHasArrived] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    startLocationTracking();
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const startLocationTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'Location permission is required for navigation');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    setCurrentLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    // Start watching location
    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (newLocation) => {
        const coords = {
          latitude: newLocation.coords.latitude,
          longitude: newLocation.coords.longitude,
        };
        setCurrentLocation(coords);
        updateLocationOnServer(coords);
        checkIfArrived(coords);
      }
    );
  };

  const updateLocationOnServer = async (coords: { latitude: number; longitude: number }) => {
    try {
      await axios.post(
        `/api/worker/requests/${requestId}/update-location`,
        {
          latitude: coords.latitude,
          longitude: coords.longitude,
        }
      );
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  };

  const checkIfArrived = (coords: { latitude: number; longitude: number }) => {
    const distance = calculateDistance(
      coords.latitude,
      coords.longitude,
      destination.latitude,
      destination.longitude
    );
    
    // If within 50 meters, consider as arrived
    if (distance < 0.05 && !hasArrived) {
      setHasArrived(true);
      Alert.alert(
        'You have arrived!',
        'Please notify the patient and mark your arrival.',
        [
          {
            text: 'Mark as Arrived',
            onPress: markAsArrived,
          },
        ]
      );
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const markAsArrived = async () => {
    try {
      await axios.post(`/api/worker/requests/${requestId}/arrived`);
      Alert.alert('Success', 'You have been marked as arrived.');
      navigation.navigate('AssessmentScreen', { requestId, patient });
    } catch (error) {
      Alert.alert('Error', 'Failed to mark arrival. Please try again.');
    }
  };

  const openInMaps = () => {
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = `${destination.latitude},${destination.longitude}`;
    const label = patient.name;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  const startNavigation = () => {
    setIsNavigating(true);
    // Center map on route
    if (mapRef.current && currentLocation) {
      mapRef.current.fitToCoordinates(
        [currentLocation, destination],
        {
          edgePadding: {
            top: 100,
            right: 50,
            bottom: 200,
            left: 50,
          },
          animated: true,
        }
      );
    }
  };

  if (!currentLocation) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Navigate to Patient</Text>
        <TouchableOpacity onPress={openInMaps} style={styles.mapsButton}>
          <Ionicons name="map-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
      >
        {/* Current Location Marker */}
        <Marker
          coordinate={currentLocation}
          title="Your Location"
        >
          <View style={styles.medicMarker}>
            <Ionicons name="medical" size={24} color={COLORS.white} />
          </View>
        </Marker>

        {/* Destination Marker */}
        <Marker
          coordinate={destination}
          title={patient.name}
          description={destination.address}
        >
          <View style={styles.patientMarker}>
            <Ionicons name="person" size={24} color={COLORS.white} />
          </View>
        </Marker>

        {/* Route */}
        <MapViewDirections
          origin={currentLocation}
          destination={destination}
          apikey={GOOGLE_MAPS_API_KEY}
          strokeWidth={4}
          strokeColor={COLORS.primary}
          onReady={(result) => {
            setRouteInfo({
              distance: result.distance,
              duration: result.duration,
            });
          }}
        />
      </MapView>

      {/* Navigation Info Card */}
      <Card style={styles.navigationCard}>
        <View style={styles.patientInfo}>
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.patientAddress}>{destination.address}</Text>
          </View>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => Linking.openURL(`tel:${patient.phone}`)}
          >
            <Ionicons name="call" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.routeInfo}>
          <View style={styles.routeItem}>
            <Ionicons name="navigate" size={20} color={COLORS.textSecondary} />
            <Text style={styles.routeText}>
              {routeInfo.distance.toFixed(1)} km
            </Text>
          </View>
          <View style={styles.routeItem}>
            <Ionicons name="time" size={20} color={COLORS.textSecondary} />
            <Text style={styles.routeText}>
              {Math.ceil(routeInfo.duration)} min
            </Text>
          </View>
        </View>

        {!isNavigating ? (
          <Button
            title="Start Navigation"
            onPress={startNavigation}
            fullWidth
            icon="navigate"
          />
        ) : hasArrived ? (
          <Button
            title="Mark as Arrived"
            onPress={markAsArrived}
            fullWidth
            variant="success"
            icon="checkmark-circle"
          />
        ) : (
          <View style={styles.navigatingStatus}>
            <Ionicons name="navigate" size={24} color={COLORS.primary} />
            <Text style={styles.navigatingText}>Navigating...</Text>
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: SPACING.base,
    backgroundColor: COLORS.white,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    ...SHADOWS.md,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  mapsButton: {
    padding: SPACING.xs,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  medicMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    ...SHADOWS.md,
  },
  patientMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    ...SHADOWS.md,
  },
  navigationCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: BORDER_RADIUS['2xl'],
    borderTopRightRadius: BORDER_RADIUS['2xl'],
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: SPACING.lg,
    ...SHADOWS.lg,
  },
  patientInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
    paddingBottom: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
  },
  patientAddress: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.base,
  },
  routeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: SPACING.base,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  routeText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  navigatingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.base,
  },
  navigatingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.primary,
  },
});
