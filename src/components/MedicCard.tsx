import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Medic } from '../types/medic';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import Avatar from './Avatar';

interface MedicCardProps {
  medic: Medic;
  onPress: (medic: Medic) => void;
  showDistance?: boolean;
}

export default function MedicCard({ medic, onPress, showDistance = true }: MedicCardProps) {
  const getStatusColor = () => {
    switch (medic.status) {
      case 'available':
        return COLORS.success;
      case 'busy':
        return COLORS.warning;
      default:
        return COLORS.textTertiary;
    }
  };

  const getStatusText = () => {
    switch (medic.status) {
      case 'available':
        return 'Available';
      case 'busy':
        return 'Busy';
      default:
        return 'Offline';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(medic)} activeOpacity={0.7}>
      <View style={styles.header}>
        <Avatar
          source={medic.profile_picture}
          name={medic.name}
          size={56}
          showBadge={medic.is_available}
          badgeColor={getStatusColor()}
        />

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {medic.name}
          </Text>
          <Text style={styles.specialty} numberOfLines={1}>
            {medic.specialty_name}
          </Text>

          <View style={styles.meta}>
            {medic.rating && (
              <View style={styles.rating}>
                <Ionicons name="star" size={14} color={COLORS.warning} />
                <Text style={styles.ratingText}>
                  {medic.rating.toFixed(1)} ({medic.total_reviews})
                </Text>
              </View>
            )}

            {medic.years_of_experience && (
              <View style={styles.experience}>
                <Ionicons name="briefcase-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.experienceText}>{medic.years_of_experience} yrs</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.status}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>

      {medic.bio && (
        <Text style={styles.bio} numberOfLines={2}>
          {medic.bio}
        </Text>
      )}

      <View style={styles.footer}>
        {showDistance && medic.distance !== undefined && (
          <View style={styles.distance}>
            <Ionicons name="location-outline" size={16} color={COLORS.primary} />
            <Text style={styles.distanceText}>{medic.distance.toFixed(1)} km away</Text>
          </View>
        )}

        {medic.hourly_rate && (
          <View style={styles.rate}>
            <Text style={styles.rateText}>KES {medic.hourly_rate.toLocaleString()}/hr</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  info: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
  },
  specialty: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  ratingText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  experience: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  experienceText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  status: {
    alignItems: 'flex-end',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: SPACING.xs / 2,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  bio: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.fontSize.sm * TYPOGRAPHY.lineHeight.normal,
    marginBottom: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  distance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  distanceText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  rate: {
    backgroundColor: COLORS.primaryLight + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.base,
  },
  rateText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
});
