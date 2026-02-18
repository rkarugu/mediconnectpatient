import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { Button, LoadingSpinner, Card, Avatar } from '../components';
import RequestCard from '../components/RequestCard';
import requestHistoryService, { RequestHistoryItem } from '../services/requestHistoryService';
import socketService from '../services/socketService';
import useRealtimeRefresh from '../hooks/useRealtimeRefresh';
import { STORAGE_URL } from '../config/api';

interface TrackingScreenProps {
  navigation: any;
  route: any;
}

export default function TrackingScreen({ navigation, route }: TrackingScreenProps) {
  const { requestId } = route.params || {};
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [requests, setRequests] = useState<RequestHistoryItem[]>([]);
  const [activeRequests, setActiveRequests] = useState<RequestHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  useEffect(() => {
    loadRequests();
    
    // If requestId is provided, load that specific request (silently to avoid errors)
    if (requestId) {
      loadRequestDetails(requestId, true);
    }
  }, [requestId]);

  // Real-time socket event listeners for live updates
  useEffect(() => {
    // Handler for when medic accepts request
    const handleMedicAssigned = (data: any) => {
      console.log('Medic assigned event:', data);
      Alert.alert('Medic Assigned', data.message || 'A medic has been assigned to your request.');
      if (selectedRequest && data.request_id === selectedRequest.id) {
        loadRequestDetails(data.request_id);
      } else {
        // Only reload list, don't try to load details of requests that aren't ours
        loadRequests();
      }
    };

    // Handler for when medic arrives
    const handleMedicArrived = (data: any) => {
      console.log('Medic arrived event:', data);
      Alert.alert('Medic Arrived', data.message || 'Your medic has arrived at your location.');
      if (selectedRequest && data.request_id === selectedRequest.id) {
        loadRequestDetails(data.request_id);
      } else {
        loadRequests();
      }
    };

    // Handler for treatment started
    const handleTreatmentStarted = (data: any) => {
      console.log('Treatment started event:', data);
      Alert.alert('Treatment Started', data.message || 'Your treatment has begun.');
      if (selectedRequest && data.request_id === selectedRequest.id) {
        loadRequestDetails(data.request_id);
      } else {
        loadRequests();
      }
    };

    // Handler for service completed
    const handleServiceCompleted = (data: any) => {
      console.log('Service completed event:', data);
      Alert.alert('Service Completed', data.message || 'Your service has been completed.');
      if (selectedRequest && data.request_id === selectedRequest.id) {
        loadRequestDetails(data.request_id);
      } else {
        loadRequests();
      }
    };

    // Handler for lab request created
    const handleLabRequestCreated = (data: any) => {
      console.log('Lab request created event:', data);
      // This is handled in NotificationProvider, but refresh data here too
      if (selectedRequest) {
        loadRequestDetails(selectedRequest.id);
      }
    };

    // Register socket event listeners
    socketService.on('service_request.accepted', handleMedicAssigned);
    socketService.on('medic.assigned', handleMedicAssigned);
    socketService.on('medic.arrived', handleMedicArrived);
    socketService.on('treatment.started', handleTreatmentStarted);
    socketService.on('service.completed', handleServiceCompleted);
    socketService.on('lab_request.created', handleLabRequestCreated);

    // Cleanup listeners on unmount
    return () => {
      socketService.off('service_request.accepted', handleMedicAssigned);
      socketService.off('medic.assigned', handleMedicAssigned);
      socketService.off('medic.arrived', handleMedicArrived);
      socketService.off('treatment.started', handleTreatmentStarted);
      socketService.off('service.completed', handleServiceCompleted);
      socketService.off('lab_request.created', handleLabRequestCreated);
    };
  }, [selectedRequest]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const allRequests = await requestHistoryService.getMyRequests();
      
      // Separate active and completed requests
      const active = allRequests.filter(r => 
        ['pending', 'accepted', 'in_progress', 'on_hold'].includes(r.status)
      );
      const history = allRequests.filter(r => 
        ['completed', 'cancelled', 'rejected'].includes(r.status)
      );
      
      setActiveRequests(active);
      setRequests(history);
    } catch (error) {
      console.error('Load requests error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRequestDetails = async (id: number, silent = false) => {
    console.log('loadRequestDetails called with ID:', id, 'silent:', silent);
    try {
      const details = await requestHistoryService.getRequestDetails(id);
      console.log('Request details loaded successfully:', details.id, 'status:', details.status);
      setSelectedRequest(details);
      setActiveTab('active');
    } catch (error: any) {
      const status = error?.response?.status;
      console.log('Load request details failed:', { id, status, silent });
      
      // Don't log full error for 404s - they're expected when requests don't belong to this patient
      if (status !== 404) {
        console.error('Load request details error:', error);
      }
      
      // Show alert for user-initiated requests (not silent) even if 404
      if (!silent) {
        if (status === 404) {
          Alert.alert('Request Not Found', 'This request could not be found or you do not have access to it.');
        } else {
          Alert.alert('Error', 'Failed to load request details');
        }
      }
    }
  };

  useRealtimeRefresh(() => {
    if (selectedRequest?.id) {
      return loadRequestDetails(selectedRequest.id, true);
    }
    return loadRequests();
  }, {
    events: [
      'service_request.accepted',
      'medic.assigned',
      'medic.arrived',
      'treatment.started',
      'service.completed',
      'lab_request.created',
      'payment.processed',
    ],
    intervalMs: 30000,
    enabled: true,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleRequestPress = (request: RequestHistoryItem) => {
    console.log('Request pressed, loading details for ID:', request.id);
    loadRequestDetails(request.id);
  };

  const handlePayWithWallet = async (requestId: number) => {
    const amount = selectedRequest?.final_total
      || selectedRequest?.estimated_price
      || selectedRequest?.amount
      || selectedRequest?.consultation_fee
      || 0;

    const displayAmount = amount > 0 ? `\nAmount: KES ${Number(amount).toLocaleString()}` : '';

    Alert.alert(
      'Confirm Wallet Payment',
      `Pay using your wallet balance?${displayAmount}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay',
          onPress: async () => {
            try {
              const result = await requestHistoryService.initiatePayment(requestId, {
                payment_method: 'wallet',
                ...(amount > 0 ? { amount } : {}),
              });
              Alert.alert('Payment Successful', result?.message || 'Paid successfully via wallet');
              // Refresh request details to reflect paid status
              loadRequestDetails(requestId);
              loadRequests();
            } catch (error: any) {
              console.error('Wallet payment error:', error);
              Alert.alert('Payment Failed', error.message || 'Payment failed');
            }
          },
        },
      ]
    );
  };

  const handleCancelRequest = async (requestId: number) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await requestHistoryService.cancelRequest(requestId);
              Alert.alert('Success', 'Request cancelled successfully');
              setSelectedRequest(null);
              loadRequests();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel request');
            }
          },
        },
      ]
    );
  };

  const renderRequestDetails = () => {
    if (!selectedRequest) return null;

    const status = selectedRequest.status || 'pending';
    const canCancel = ['pending', 'accepted'].includes(status);
    const hasMedicAssigned = status !== 'pending' && selectedRequest.medic;
    const medicName = hasMedicAssigned ? selectedRequest.medic.name : 'Finding Medic...';
    const medicSpecialty = hasMedicAssigned ? selectedRequest.medic.specialty : 'Searching for available medics';
    const medicSubspecialty = hasMedicAssigned ? selectedRequest.medic.subspecialty : null;
    const medicYearsOfExperience = hasMedicAssigned ? selectedRequest.medic.years_of_experience : null;
    const medicDistanceKm = hasMedicAssigned ? selectedRequest.medic.distance_km : null;
    const medicProfilePicture = hasMedicAssigned ? selectedRequest.medic.profile_picture : null;
    const locationAddress = selectedRequest.location?.address || 'Location not specified';

    const getStatusTitle = () => {
      switch (status) {
        case 'pending': return 'Finding Medic...';
        case 'accepted': return 'Medic On The Way';
        case 'in_progress': return 'Treatment In Progress';
        case 'on_hold': return 'Awaiting Lab Results';
        case 'completed': return 'Service Completed';
        case 'cancelled': return 'Request Cancelled';
        default: return 'Request Status';
      }
    };

    const getStatusIcon = () => {
      switch (status) {
        case 'pending': return 'search';
        case 'accepted': return 'car';
        case 'in_progress': return 'medkit';
        case 'on_hold': return 'flask';
        case 'completed': return 'checkmark-circle';
        case 'cancelled': return 'close-circle';
        default: return 'time';
      }
    };

    const getStatusColor = () => {
      switch (status) {
        case 'pending': return COLORS.warning;
        case 'accepted': return COLORS.primary;
        case 'in_progress': return COLORS.success;
        case 'on_hold': return COLORS.warning;
        case 'completed': return COLORS.success;
        case 'cancelled': return COLORS.error;
        default: return COLORS.textSecondary;
      }
    };

    return (
      <ScrollView
        style={styles.detailsContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedRequest(null)}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          <Text style={styles.backText}>Back to Requests</Text>
        </TouchableOpacity>

        {/* Status Header */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={getStatusIcon() as any}
              size={48}
              color={getStatusColor()}
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>{getStatusTitle()}</Text>
              <Text style={styles.statusSubtitle}>
                {status === 'pending' && 'Please wait...'}
                {status === 'accepted' && 'Medic is on the way to your location'}
                {status === 'in_progress' && 'Medic is providing treatment'}
                {status === 'on_hold' && 'Treatment paused while waiting for lab test results'}
                {status === 'completed' && 'Treatment completed successfully'}
                {status === 'cancelled' && 'This request was cancelled'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Medic Info */}
        <Card style={styles.medicCard}>
          <Text style={styles.sectionTitle}>
            {hasMedicAssigned ? 'Assigned Medic' : 'Finding Medic'}
          </Text>
          <View style={styles.medicInfo}>
            {medicProfilePicture ? (
              <Image 
                source={{ uri: `${STORAGE_URL}/${medicProfilePicture}` }} 
                style={styles.medicProfileImage}
              />
            ) : (
              <View style={styles.iconContainer}>
                <Ionicons 
                  name={hasMedicAssigned ? 'medical' : 'search'} 
                  size={32} 
                  color={COLORS.primary} 
                />
              </View>
            )}
            <View style={styles.medicDetails}>
              <Text style={styles.medicName}>{medicName}</Text>
              <Text style={styles.medicSpecialty}>{medicSpecialty}</Text>
              {medicSubspecialty && (
                <Text style={styles.medicSubspecialty}>{medicSubspecialty}</Text>
              )}
              {medicYearsOfExperience && (
                <Text style={styles.medicExperience}>
                  {medicYearsOfExperience} {medicYearsOfExperience === 1 ? 'year' : 'years'} experience
                </Text>
              )}
            </View>
          </View>
          
          {/* Distance info - only show when medic is en route (accepted status) */}
          {status === 'accepted' && medicDistanceKm !== null && medicDistanceKm !== undefined && (
            <View style={styles.distanceRow}>
              <Ionicons name="navigate-outline" size={18} color={COLORS.primary} />
              <Text style={styles.distanceText}>
                {medicDistanceKm < 1 
                  ? `${Math.round(medicDistanceKm * 1000)}m away from you` 
                  : `${medicDistanceKm.toFixed(1)} km away from you`}
              </Text>
            </View>
          )}
          
          {/* Track Medic Button - only show when medic is en route (accepted status) */}
          {hasMedicAssigned && status === 'accepted' && (
            <Button
              title="Track Medic on Map"
              onPress={() => navigation.navigate('LiveTracking', { requestId: selectedRequest.id })}
              style={{ marginTop: SPACING.md }}
            />
          )}
        </Card>

        {/* Request Details */}
        <Card style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Request Details</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color={COLORS.textSecondary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{locationAddress}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="medical-outline" size={20} color={COLORS.textSecondary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Service Type</Text>
              <Text style={styles.detailValue}>
                {selectedRequest.is_emergency ? 'Emergency' : 'Standard'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.textSecondary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Requested</Text>
              <Text style={styles.detailValue}>
                {new Date(selectedRequest.created_at).toLocaleString()}
              </Text>
            </View>
          </View>

          {selectedRequest.notes && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={20} color={COLORS.textSecondary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.detailValue}>{selectedRequest.notes}</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Lab Requests Section - show when in_progress, on_hold, or completed */}
        {(status === 'in_progress' || status === 'on_hold' || status === 'completed') && (
          <Card style={styles.detailsCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Lab Tests</Text>
              <TouchableOpacity onPress={() => loadRequestDetails(selectedRequest.id)}>
                <Ionicons name="refresh" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            
            {selectedRequest.lab_requests && selectedRequest.lab_requests.length > 0 ? (
              selectedRequest.lab_requests.map((labRequest: any, index: number) => (
                <View key={labRequest.id} style={styles.labRequestItem}>
                  <View style={styles.labRequestHeader}>
                    <View style={styles.labBadge}>
                      <Ionicons name="flask" size={16} color={COLORS.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.labRequestTitle}>
                        Lab Request #{labRequest.id}
                      </Text>
                      <Text style={styles.labRequestStatus}>
                        Status: {labRequest.status}
                      </Text>
                    </View>
                    <Text style={styles.labRequestAmount}>
                      KES {parseFloat(labRequest.total_amount).toLocaleString()}
                    </Text>
                  </View>

                  {labRequest.lab_facility && (
                    <View style={styles.labDetailRow}>
                      <Ionicons name="business-outline" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.labDetailText}>{labRequest.lab_facility.name}</Text>
                    </View>
                  )}

                  {labRequest.tests && labRequest.tests.length > 0 && (
                    <View style={styles.labDetailRow}>
                      <Ionicons name="list-outline" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.labDetailText}>
                        {labRequest.tests.length} test{labRequest.tests.length > 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}

                  {labRequest.clinical_notes && (
                    <View style={styles.labDetailRow}>
                      <Ionicons name="document-text-outline" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.labDetailText}>{labRequest.clinical_notes}</Text>
                    </View>
                  )}

                  {(labRequest.status === 'pending' || labRequest.status === 'assigned') && (
                    <Button
                      title="Review & Pay"
                      onPress={() => navigation.navigate('LabConsent', { requestId: labRequest.id })}
                      style={{ marginTop: SPACING.sm }}
                      size="sm"
                    />
                  )}

                  {labRequest.status === 'completed' && (
                    <Button
                      title="View Results"
                      onPress={() => navigation.navigate('LabResults', { labRequestId: labRequest.id })}
                      style={{ marginTop: SPACING.sm, backgroundColor: COLORS.success }}
                      size="sm"
                    />
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyLabSection}>
                <Ionicons name="flask-outline" size={32} color={COLORS.textSecondary} />
                <Text style={styles.emptyLabText}>No lab tests ordered yet</Text>
              </View>
            )}
          </Card>
        )}

        {/* Prescription Section - show when completed */}
        {status === 'completed' && selectedRequest.prescription && (
          <Card style={styles.detailsCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.prescriptionHeader}>
                <Ionicons name="document-text" size={24} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Prescription</Text>
              </View>
            </View>
            
            <View style={styles.prescriptionContent}>
              <View style={styles.prescriptionRow}>
                <Text style={styles.prescriptionLabel}>Diagnosis:</Text>
                <Text style={styles.prescriptionValue}>{selectedRequest.prescription.diagnosis}</Text>
              </View>

              <Text style={styles.prescriptionLabel}>Medications:</Text>
              {selectedRequest.prescription.medications.map((med: any, index: number) => (
                <View key={index} style={styles.medicationItem}>
                  <View style={styles.medicationHeader}>
                    <Ionicons name="medical" size={16} color={COLORS.primary} />
                    <Text style={styles.medicationName}>{med.name}</Text>
                  </View>
                  <Text style={styles.medicationDetail}>Dosage: {med.dosage}</Text>
                  <Text style={styles.medicationDetail}>Frequency: {med.frequency}</Text>
                  <Text style={styles.medicationDetail}>Duration: {med.duration}</Text>
                </View>
              ))}

              {selectedRequest.prescription.instructions && (
                <View style={styles.prescriptionRow}>
                  <Text style={styles.prescriptionLabel}>Instructions:</Text>
                  <Text style={styles.prescriptionValue}>{selectedRequest.prescription.instructions}</Text>
                </View>
              )}

              {selectedRequest.prescription.notes && (
                <View style={styles.prescriptionRow}>
                  <Text style={styles.prescriptionLabel}>Notes:</Text>
                  <Text style={styles.prescriptionValue}>{selectedRequest.prescription.notes}</Text>
                </View>
              )}

              <View style={styles.prescriptionRow}>
                <Text style={styles.prescriptionLabel}>Issued:</Text>
                <Text style={styles.prescriptionValue}>
                  {new Date(selectedRequest.prescription.issued_at).toLocaleString()}
                </Text>
              </View>

              <Button
                title="Download Prescription"
                onPress={() => Alert.alert('Download', 'Prescription download feature coming soon')}
                style={{ marginTop: SPACING.md }}
                size="sm"
              />
            </View>
          </Card>
        )}

        {/* Cancel Button */}
        {canCancel && (
          <Button
            title="Cancel Request"
            onPress={() => handleCancelRequest(selectedRequest.id)}
            variant="outline"
            style={styles.cancelButton}
          />
        )}

        {/* Payment Button - show when medic arrives or service is completed and not paid */}
        {(status === 'accepted' || status === 'completed') && selectedRequest.payment_status !== 'paid' && (
          <Card style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <Ionicons name="card-outline" size={24} color={COLORS.primary} />
              <Text style={styles.paymentTitle}>
                {status === 'accepted' ? 'Payment Required' : 'Complete Payment'}
              </Text>
            </View>
            <Text style={styles.paymentMessage}>
              {status === 'accepted' 
                ? 'Please complete payment before the medic can start treatment.'
                : 'Complete your payment to receive your prescription.'}
            </Text>
            <View style={styles.paymentAmount}>
              <Text style={styles.paymentAmountLabel}>Amount Due:</Text>
              <Text style={styles.paymentAmountValue}>
                KES {selectedRequest.amount?.toLocaleString() || '0'}
              </Text>
            </View>
            <Button
              title="Pay with Wallet"
              onPress={() => handlePayWithWallet(selectedRequest.id)}
              style={{ marginBottom: SPACING.sm, backgroundColor: '#3498DB' }}
            />
            <Button
              title="Other Payment Options"
              onPress={() => navigation.navigate('Payment', { requestId: selectedRequest.id })}
              style={{ marginBottom: SPACING.md, backgroundColor: '#2ECC71' }}
            />
          </Card>
        )}

        {/* Review Button - show when paid but not reviewed */}
        {status === 'completed' && selectedRequest.payment_status === 'paid' && !selectedRequest.has_review && (
          <Button
            title="Rate Your Experience"
            onPress={() => navigation.navigate('Review', { requestId: selectedRequest.id })}
            style={{ marginBottom: SPACING.md }}
          />
        )}

        <Button
          title="Go Back"
          onPress={() => setSelectedRequest(null)}
          style={{ marginBottom: 40 }}
        />
      </ScrollView>
    );
  };

  const renderRequestsList = (requestsList: RequestHistoryItem[]) => {
    if (requestsList.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>No Requests</Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'active'
              ? 'You have no active requests'
              : 'Your completed requests will appear here'}
          </Text>
          {activeTab === 'active' && (
            <Button
              title="Request a Medic"
              onPress={() => navigation.navigate('Request')}
              style={styles.emptyButton}
            />
          )}
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {requestsList.map((request) => (
          <RequestCard
            key={request.id}
            id={request.id}
            status={request.status}
            medicName={request.status !== 'pending' ? request.medic_name : null}
            medicProfilePicture={request.medic_profile_picture}
            medicSubspecialty={request.medic_subspecialty}
            medicYearsOfExperience={request.medic_years_of_experience}
            medicDistanceKm={request.medic_distance_km}
            specialty={request.status !== 'pending' ? request.specialty : null}
            address={request.address}
            scheduledTime={request.scheduled_time}
            createdAt={request.created_at}
            isEmergency={request.is_emergency}
            onPress={() => handleRequestPress(request)}
          />
        ))}
      </ScrollView>
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading requests..." />;
  }

  if (selectedRequest) {
    return <View style={styles.container}>{renderRequestDetails()}</View>;
  }

  return (
    <View style={styles.container}>
      {/* Header with Logo */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>My Requests</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Active ({activeRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History ({requests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'active'
        ? renderRequestsList(activeRequests)
        : renderRequestsList(requests)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.base,
    backgroundColor: COLORS.white,
    ...SHADOWS.md,
  },
  logo: {
    width: 150,
    height: 40,
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.base,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.base,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  emptyButton: {
    minWidth: 200,
  },
  detailsContainer: {
    flex: 1,
    padding: SPACING.base,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
    paddingVertical: SPACING.sm,
  },
  backText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textPrimary,
    marginLeft: SPACING.xs,
  },
  statusCard: {
    marginBottom: SPACING.base,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
    marginLeft: SPACING.base,
  },
  statusTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
  },
  statusSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  mapPreview: {
    height: 200,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.base,
    ...SHADOWS.md,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicCard: {
    marginBottom: SPACING.base,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  medicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  medicDetails: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  medicName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
  },
  medicSpecialty: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs / 2,
  },
  medicSubspecialty: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
    marginBottom: SPACING.xs / 2,
  },
  medicExperience: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  medicProfileImage: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.md,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight + '15',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.xs,
  },
  distanceText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  rating: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: SPACING.xs,
  },
  contactButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary,
  },
  detailsCard: {
    marginBottom: SPACING.base,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  detailContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs / 2,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textPrimary,
  },
  cancelButton: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  labRequestItem: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  labRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  labBadge: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  labRequestTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
  },
  labRequestStatus: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  labRequestAmount: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  labDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  labDetailText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  emptyLabSection: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  emptyLabText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  prescriptionContent: {
    marginTop: SPACING.sm,
  },
  prescriptionRow: {
    marginBottom: SPACING.md,
  },
  prescriptionLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  prescriptionValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  medicationItem: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  medicationName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  medicationDetail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs / 2,
  },
  paymentCard: {
    marginBottom: SPACING.base,
    backgroundColor: COLORS.primaryLight + '10',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  paymentTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  paymentMessage: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    lineHeight: 22,
  },
  paymentAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  paymentAmountLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  paymentAmountValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
});
