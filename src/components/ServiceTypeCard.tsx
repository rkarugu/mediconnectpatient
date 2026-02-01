import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

interface ServiceTypeCardProps {
  id: number;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  basePrice: number;
  selected?: boolean;
  onPress: () => void;
}

export default function ServiceTypeCard({
  name,
  description,
  icon,
  color,
  basePrice,
  selected = false,
  onPress,
}: ServiceTypeCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && styles.cardSelected,
        { borderColor: selected ? color : COLORS.border },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={32} color={color} />
      </View>

      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
        <Text style={styles.price}>From KES {basePrice.toLocaleString()}</Text>
      </View>

      {selected && (
        <View style={[styles.checkmark, { backgroundColor: color }]}>
          <Ionicons name="checkmark" size={20} color={COLORS.white} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardSelected: {
    borderWidth: 2,
    ...SHADOWS.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    lineHeight: TYPOGRAPHY.fontSize.sm * TYPOGRAPHY.lineHeight.normal,
  },
  price: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary,
  },
  checkmark: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
