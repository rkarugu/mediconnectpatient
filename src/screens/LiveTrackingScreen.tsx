import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import requestHistoryService from '../services/requestHistoryService';
import socketService from '../services/socketService';

const { width, height } = Dimensions.get('window');

interface LiveTrackingScreenProps {
  navigation: any;
  route: any;
}

export default function LiveTrackingScreen({ navigation, route }: LiveTrackingScreenProps) {
  const { requestId } = route.params;
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  const [loading, setLoading] = useState(true);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [medicLocation, setMedicLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);

  useEffect(() => {
    loadMedicLocation();
    // Poll for medic location every 10 seconds (reduced since we have socket updates)
    pollingInterval.current = setInterval(loadMedicLocation, 10000);

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [requestId]);

  // Real-time socket event listeners
  useEffect(() => {
    const handleMedicArrived = (data: any) => {
      if (data.request_id === requestId) {
        Alert.alert('Medic Arrived', data.message || 'Your medic has arrived!');
        loadMedicLocation();
      }
    };

    const handleTreatmentStarted = (data: any) => {
      if (data.request_id === requestId) {
        Alert.alert('Treatment Started', data.message || 'Your treatment has begun.');
        loadMedicLocation();
      }
    };

    const handleServiceCompleted = (data: any) => {
      if (data.request_id === requestId) {
        Alert.alert(
          'Service Completed',
          data.message || 'Your service has been completed.',
          [{ text: 'OK', onPress: () => navigation.navigate('Payment', { requestId }) }]
        );
      }
    };

    const handleLocationUpdate = (data: any) => {
      if (data.request_id === requestId && data.latitude && data.longitude) {
        setMedicLocation({
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
        });
        // Update distance and ETA if provided
        if (data.distance_km !== undefined) {
          setDistanceKm(data.distance_km);
        }
        if (data.eta_minutes !== undefined) {
          setEtaMinutes(data.eta_minutes);
        }
      }
    };

    socketService.on('medic.arrived', handleMedicArrived);
    socketService.on('treatment.started', handleTreatmentStarted);
    socketService.on('service.completed', handleServiceCompleted);
    socketService.on('medic.location_update', handleLocationUpdate);

    return () => {
      socketService.off('medic.arrived', handleMedicArrived);
      socketService.off('treatment.started', handleTreatmentStarted);
      socketService.off('service.completed', handleServiceCompleted);
      socketService.off('medic.location_update', handleLocationUpdate);
    };
  }, [requestId, navigation]);

  const loadMedicLocation = async () => {
    try {
      const data = await requestHistoryService.getMedicLocation(requestId);
      setTrackingData(data);
      
      if (data.location?.latitude && data.location?.longitude) {
        setMedicLocation({
          latitude: parseFloat(data.location.latitude),
          longitude: parseFloat(data.location.longitude),
        });
      }
    } catch (error) {
      console.error('Failed to load medic location:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCallMedic = () => {
    if (trackingData?.medic?.phone) {
      Linking.openURL(`tel:${trackingData.medic.phone}`);
    } else {
      Alert.alert('No Phone', 'Medic phone number not available');
    }
  };

  const fitMapToMarkers = () => {
    if (mapRef.current && medicLocation && trackingData?.destination) {
      mapRef.current.fitToCoordinates(
        [
          medicLocation,
          {
            latitude: parseFloat(trackingData.destination.latitude),
            longitude: parseFloat(trackingData.destination.longitude),
          },
        ],
        {
          edgePadding: { top: 150, right: 50, bottom: 250, left: 50 },
          animated: true,
        }
      );
    }
  };

  useEffect(() => {
    if (medicLocation && trackingData?.destination) {
      fitMapToMarkers();
    }
  }, [medicLocation, trackingData]);

  const getStatusMessage = () => {
    switch (trackingData?.request_status) {
      case 'accepted':
        return 'Medic is on the way';
      case 'in_progress':
        return 'Service in progress';
      default:
        return 'Tracking medic...';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading tracking data...</Text>
      </View>
    );
  }

  if (!trackingData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="warning-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.errorText}>Unable to load tracking data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadMedicLocation}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: medicLocation?.latitude || parseFloat(trackingData.destination.latitude),
          longitude: medicLocation?.longitude || parseFloat(trackingData.destination.longitude),
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Medic Location Marker */}
        {medicLocation && (
          <Marker
            coordinate={medicLocation}
            title={trackingData.medic?.name || 'Medic'}
            description="Medic's current location"
          >
            <View style={styles.medicMarker}>
              <Ionicons name="car" size={24} color={COLORS.white} />
            </View>
          </Marker>
        )}

        {/* Patient/Destination Marker */}
        <Marker
          coordinate={{
            latitude: parseFloat(trackingData.destination.latitude),
            longitude: parseFloat(trackingData.destination.longitude),
          }}
          title="Your Location"
          description={trackingData.destination.address}
        >
          <View style={styles.destinationMarker}>
            <Ionicons name="location" size={24} color={COLORS.white} />
          </View>
        </Marker>
      </MapView>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Live Tracking</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{getStatusMessage()}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={loadMedicLocation}>
          <Ionicons name="refresh" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Bottom Panel */}
      <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 16 }]}>
        {/* Distance and ETA Info */}
        {(distanceKm !== null || etaMinutes !== null) && (
          <View style={styles.etaContainer}>
            {distanceKm !== null && (
              <View style={styles.etaItem}>
                <Ionicons name="navigate" size={20} color={COLORS.primary} />
                <Text style={styles.etaValue}>{distanceKm} km</Text>
                <Text style={styles.etaLabel}>away</Text>
              </View>
            )}
            {etaMinutes !== null && (
              <View style={styles.etaItem}>
                <Ionicons name="time" size={20} color={COLORS.primary} />
                <Text style={styles.etaValue}>{etaMinutes} min</Text>
                <Text style={styles.etaLabel}>ETA</Text>
              </View>
            )}
          </View>
        )}

        {/* Medic Info */}
        <View style={styles.medicInfo}>
          <View style={styles.medicAvatar}>
            <Ionicons name="medical" size={32} color={COLORS.primary} />
          </View>
          <View style={styles.medicDetails}>
            <Text style={styles.medicName}>{trackingData.medic?.name || 'Medic'}</Text>
            <Text style={styles.medicAddress} numberOfLines={1}>
              {trackingData.destination?.address || 'En route to your location'}
            </Text>
            {trackingData.location?.updated_at && (
              <Text style={styles.lastUpdate}>
                Last updated: {new Date(trackingData.location.updated_at).toLocaleTimeString()}
              </Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.callButton} onPress={handleCallMedic}>
            <Ionicons name="call" size={24} color={COLORS.white} />
            <Text style={styles.callButtonText}>Call Medic</Text>
          </TouchableOpacity>
        </View>

        {/* Cancel Button */}
        {trackingData.request_status === 'accepted' && (
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Back to Request Details</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  retryButton: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
  },
  map: {
    width: width,
    height: height,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.base,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  headerInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: SPACING.xs,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.success,
    fontWeight: '500',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  medicMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    ...SHADOWS.lg,
  },
  destinationMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    ...SHADOWS.lg,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.lg,
  },
  etaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  etaItem: {
    alignItems: 'center',
  },
  etaValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  etaLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  medicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  medicAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicDetails: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  medicName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  medicAddress: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs / 2,
  },
  lastUpdate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  actionButtons: {
    marginBottom: SPACING.md,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  callButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
});
