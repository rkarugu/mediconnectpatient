import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

interface RequestCardProps {
  id: number;
  status: string;
  medicName?: string | null;
  medicProfilePicture?: string | null;
  medicSubspecialty?: string | null;
  medicYearsOfExperience?: number | null;
  medicDistanceKm?: number | null;
  specialty?: string | null;
  address?: string | null;
  scheduledTime?: string;
  createdAt: string;
  isEmergency?: boolean;
  onPress: () => void;
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) {
    return 'Date not available';
  }
  
  try {
    // Handle ISO 8601 format: "2026-01-22T00:45:00+03:00"
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.log('Invalid date string:', dateString);
      return 'Date not available';
    }
    
    // Format the date
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    
    return date.toLocaleString('en-US', options);
  } catch (error) {
    console.error('Date formatting error:', error, dateString);
    return 'Date not available';
  }
};

export default function RequestCard({
  status,
  medicName,
  medicProfilePicture,
  medicSubspecialty,
  medicYearsOfExperience,
  medicDistanceKm,
  specialty,
  address,
  scheduledTime,
  createdAt,
  isEmergency,
  onPress,
}: RequestCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: COLORS.warning, icon: 'time-outline' as const, label: 'Pending' };
      case 'accepted':
        return { color: COLORS.info, icon: 'checkmark-circle-outline' as const, label: 'Accepted' };
      case 'in_progress':
        return { color: COLORS.primary, icon: 'car-outline' as const, label: 'In Progress' };
      case 'completed':
        return { color: COLORS.success, icon: 'checkmark-done-outline' as const, label: 'Completed' };
      case 'cancelled':
        return { color: COLORS.textSecondary, icon: 'close-circle-outline' as const, label: 'Cancelled' };
      case 'rejected':
        return { color: COLORS.error, icon: 'close-circle-outline' as const, label: 'Rejected' };
      default:
        return { color: COLORS.textSecondary, icon: 'help-circle-outline' as const, label: status };
    }
  };

  const statusConfig = getStatusConfig(status);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
        <Ionicons name={statusConfig.icon} size={16} color={statusConfig.color} />
        <Text style={[styles.statusText, { color: statusConfig.color }]}>
          {statusConfig.label}
        </Text>
      </View>

      {isEmergency && (
        <View style={styles.emergencyBadge}>
          <Ionicons name="alert-circle" size={16} color={COLORS.error} />
          <Text style={styles.emergencyText}>Emergency</Text>
        </View>
      )}

      {/* Medic Info */}
      <View style={styles.medicInfo}>
        {medicProfilePicture ? (
          <Image 
            source={{ uri: medicProfilePicture }} 
            style={styles.profileImage}
          />
        ) : (
          <View style={styles.iconContainer}>
            <Ionicons name="medical" size={24} color={COLORS.primary} />
          </View>
        )}
        <View style={styles.medicDetails}>
          <Text style={styles.medicName}>{medicName ?? 'Finding Medic...'}</Text>
          <Text style={styles.specialty}>{specialty ?? 'Pending Assignment'}</Text>
          {medicSubspecialty && (
            <Text style={styles.subspecialty}>{medicSubspecialty}</Text>
          )}
          {medicYearsOfExperience && (
            <Text style={styles.experience}>
              {medicYearsOfExperience} {medicYearsOfExperience === 1 ? 'year' : 'years'} experience
            </Text>
          )}
        </View>
      </View>

      {/* Distance from patient */}
      {medicDistanceKm !== null && medicDistanceKm !== undefined && (
        <View style={styles.infoRow}>
          <Ionicons name="navigate-outline" size={16} color={COLORS.primary} />
          <Text style={[styles.infoText, { color: COLORS.primary, fontWeight: '600' }]}>
            {medicDistanceKm < 1 
              ? `${Math.round(medicDistanceKm * 1000)}m away` 
              : `${medicDistanceKm} km away`}
          </Text>
        </View>
      )}

      {/* Location */}
      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
        <Text style={styles.infoText} numberOfLines={1}>
          {address || 'Location not specified'}
        </Text>
      </View>

      {/* Time */}
      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
        <Text style={styles.infoText}>
          {scheduledTime
            ? `Scheduled: ${formatDate(scheduledTime)}`
            : `Requested: ${formatDate(createdAt)}`}
        </Text>
      </View>

      {/* View Details Arrow */}
      <View style={styles.arrow}>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.sm,
    gap: SPACING.xs / 2,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  emergencyBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs / 2,
  },
  emergencyText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.error,
  },
  medicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  medicDetails: {
    flex: 1,
  },
  medicName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
  },
  specialty: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  subspecialty: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
    marginTop: 2,
  },
  experience: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  arrow: {
    position: 'absolute',
    right: SPACING.base,
    top: '50%',
    marginTop: -10,
  },
});
