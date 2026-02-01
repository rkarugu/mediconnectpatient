import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS } from '../constants/theme';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: number;
  style?: ViewStyle;
  showBadge?: boolean;
  badgeColor?: string;
}

export default function Avatar({
  source,
  name,
  size = 48,
  style,
  showBadge = false,
  badgeColor = COLORS.success,
}: AvatarProps) {
  const getInitials = (fullName?: string): string => {
    if (!fullName) return '?';
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  return (
    <View style={[containerStyle, style]}>
      {source ? (
        <Image source={{ uri: source }} style={styles.image} />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
          {getInitials(name)}
        </Text>
      )}

      {showBadge && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: badgeColor,
              width: size * 0.25,
              height: size * 0.25,
              borderRadius: (size * 0.25) / 2,
              bottom: size * 0.05,
              right: size * 0.05,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  badge: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
});
