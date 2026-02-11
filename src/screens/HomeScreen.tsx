import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Medic, MedicalSpecialty } from '../types/medic';
import medicService from '../services/medicService';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { LoadingSpinner, BottomSheet, Button } from '../components';
import MedicCard from '../components/MedicCard';
import { useAuthStore } from '../store/authStore';
import useRealtimeRefresh from '../hooks/useRealtimeRefresh';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const INITIAL_REGION = {
  latitude: -1.286389,
  longitude: 36.817223,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region>(INITIAL_REGION);
  const [medics, setMedics] = useState<Medic[]>([]);
  const [specialties, setSpecialties] = useState<MedicalSpecialty[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<number | null>(null);
  const [selectedMedic, setSelectedMedic] = useState<Medic | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMedics, setLoadingMedics] = useState(false);
  const [showMedicsList, setShowMedicsList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadSpecialties = useCallback(async () => {
    try {
      const data = await medicService.getMedicalSpecialties();
      setSpecialties(data);
    } catch (error) {
      console.error('Load specialties error:', error);
    }
  }, []);

  const loadNearbyMedics = useCallback(async () => {
    if (!location) return;

    setLoadingMedics(true);
    try {
      const data = await medicService.getNearbyMedics({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        radius: 10,
        specialty_id: selectedSpecialty || undefined,
      });
      setMedics(data);
    } catch (error) {
      console.error('Load nearby medics error:', error);
      Alert.alert('Error', 'Failed to load nearby medics. Please try again.');
    } finally {
      setLoadingMedics(false);
    }
  }, [location, selectedSpecialty]);

  useEffect(() => {
    requestLocationPermission();
    loadSpecialties();
  }, [loadSpecialties]);

  useEffect(() => {
    if (location) {
      loadNearbyMedics();
    }
  }, [location, selectedSpecialty, loadNearbyMedics]);

  useRealtimeRefresh(loadNearbyMedics, {
    events: ['medic.location_update', 'medic.assigned', 'service_request.accepted'],
    intervalMs: 30000,
    enabled: !!location,
  });

  const requestLocationPermission = async () => {
    try {
      console.log('Requesting location permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('Location permission status:', status);
      
      if (status !== 'granted') {
        console.log('Location permission denied');
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to find nearby medics. You can still use the app with the default location.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      console.log('Getting current position...');
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeoutMs: 10000,
      });
      console.log('Got location:', currentLocation.coords);

      setLocation(currentLocation);
      
      const newRegion = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
      setLoading(false);
    } catch (error: any) {
      console.error('Location permission error:', error);
      console.error('Error details:', error.message, error.code);
      setLoading(false);
    }
  };


  const handleMedicPress = (medic: Medic) => {
    setSelectedMedic(medic);
    if (medic.latitude && medic.longitude) {
      mapRef.current?.animateToRegion(
        {
          latitude: medic.latitude,
          longitude: medic.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    }
  };

  const handleRequestMedic = (medic?: Medic) => {
    navigation.navigate('Request', {
      medic,
      location: location?.coords,
      specialty: selectedSpecialty,
    });
  };

  const centerOnUser = () => {
    if (location) {
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      mapRef.current?.animateToRegion(newRegion, 1000);
    }
  };

  const filteredMedics = medics.filter((medic) =>
    medic.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    medic.specialty_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner fullScreen text="Getting your location..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header - Uber-inspired */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        {/* Logo Row */}
        <View style={styles.logoRow}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={20} color={COLORS.white} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>Hello, {user?.first_name || 'Patient'}!</Text>
          <Text style={styles.subtitle}>Find medical help nearby</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search medics or services..."
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Specialty Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedSpecialty === null && styles.filterChipActive,
            ]}
            onPress={() => setSelectedSpecialty(null)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedSpecialty === null && styles.filterChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {specialties.map((specialty) => (
            <TouchableOpacity
              key={specialty.id}
              style={[
                styles.filterChip,
                selectedSpecialty === specialty.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedSpecialty(specialty.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedSpecialty === specialty.id && styles.filterChipTextActive,
                ]}
              >
                {specialty.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={region}
          showsUserLocation
          showsMyLocationButton={false}
          onRegionChangeComplete={setRegion}
        >
          {filteredMedics.map((medic) => (
            medic.latitude && medic.longitude && (
              <Marker
                key={medic.id}
                coordinate={{
                  latitude: Number(medic.latitude),
                  longitude: Number(medic.longitude),
                }}
                onPress={() => handleMedicPress(medic)}
              >
                <View
                  style={[
                    styles.markerContainer,
                    selectedMedic?.id === medic.id && styles.markerContainerSelected,
                  ]}
                >
                  <Ionicons
                    name="medical"
                    size={20}
                    color={medic.is_available ? COLORS.success : COLORS.textSecondary}
                  />
                </View>
              </Marker>
            )
          ))}
        </MapView>

        {/* Map Controls */}
        <TouchableOpacity style={styles.myLocationButton} onPress={centerOnUser}>
          <Ionicons name="locate" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.listToggleButton}
          onPress={() => setShowMedicsList(!showMedicsList)}
        >
          <Ionicons
            name={showMedicsList ? 'map-outline' : 'list-outline'}
            size={24}
            color={COLORS.white}
          />
          <Text style={styles.listToggleText}>
            {showMedicsList ? 'Map' : 'List'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Request Button */}
      <View style={styles.quickRequestContainer}>
        <Button
          title="Request Medic Now"
          onPress={() => handleRequestMedic()}
          icon={<Ionicons name="add-circle-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />}
          size="lg"
          fullWidth
        />
      </View>

      {/* Medics List Bottom Sheet */}
      <BottomSheet
        visible={showMedicsList}
        onClose={() => setShowMedicsList(false)}
        snapPoints={[SCREEN_HEIGHT * 0.5, SCREEN_HEIGHT * 0.85]}
      >
        <View style={styles.bottomSheetHeader}>
          <Text style={styles.bottomSheetTitle}>
            {loadingMedics ? 'Loading...' : `${filteredMedics.length} Medics Nearby`}
          </Text>
        </View>

        {loadingMedics ? (
          <LoadingSpinner text="Finding nearby medics..." />
        ) : (
          <ScrollView
            style={styles.medicsList}
            showsVerticalScrollIndicator={false}
          >
            {filteredMedics.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={64} color={COLORS.textTertiary} />
                <Text style={styles.emptyStateText}>No medics found nearby</Text>
                <Text style={styles.emptyStateSubtext}>
                  Try adjusting your filters or search area
                </Text>
              </View>
            ) : (
              filteredMedics.map((medic) => (
                <MedicCard
                  key={medic.id}
                  medic={medic}
                  onPress={() => {
                    handleMedicPress(medic);
                    setShowMedicsList(false);
                  }}
                />
              ))
            )}
          </ScrollView>
        )}
      </BottomSheet>

      {/* Selected Medic Card */}
      {selectedMedic && !showMedicsList && (
        <View style={styles.selectedMedicContainer}>
          <MedicCard medic={selectedMedic} onPress={handleMedicPress} />
          <View style={styles.selectedMedicActions}>
            <Button
              title="Request This Medic"
              onPress={() => handleRequestMedic(selectedMedic)}
              fullWidth
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedMedic(null)}
            >
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.md,
    ...SHADOWS.md,
    zIndex: 10,
  },
  logoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logo: {
    width: 160,
    height: 45,
  },
  profileButton: {
    padding: SPACING.xs,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingContainer: {
    marginBottom: SPACING.md,
  },
  greeting: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs / 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textPrimary,
  },
  filtersContainer: {
    marginHorizontal: -SPACING.base,
  },
  filtersContent: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.md,
  },
  markerContainerSelected: {
    backgroundColor: COLORS.primary,
  },
  myLocationButton: {
    position: 'absolute',
    top: SPACING.base,
    right: SPACING.base,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.md,
  },
  listToggleButton: {
    position: 'absolute',
    bottom: SPACING.base,
    right: SPACING.base,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.lg,
    gap: SPACING.sm,
  },
  listToggleText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  quickRequestContainer: {
    position: 'absolute',
    bottom: SPACING.base,
    left: SPACING.base,
    right: SCREEN_WIDTH / 2 + SPACING.sm,
  },
  bottomSheetHeader: {
    paddingBottom: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.base,
  },
  bottomSheetTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  medicsList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['5xl'],
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginTop: SPACING.base,
  },
  emptyStateSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  selectedMedicContainer: {
    position: 'absolute',
    bottom: SPACING.base,
    left: SPACING.base,
    right: SPACING.base,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.xl,
  },
  selectedMedicActions: {
    padding: SPACING.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    padding: SPACING.xs,
  },
});
