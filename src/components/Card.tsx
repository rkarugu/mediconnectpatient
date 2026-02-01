import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: keyof typeof SPACING;
}

export default function Card({
  children,
  style,
  onPress,
  variant = 'default',
  padding = 'base',
}: CardProps) {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: COLORS.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING[padding],
    };

    const variantStyles: Record<string, ViewStyle> = {
      default: {
        ...SHADOWS.sm,
      },
      outlined: {
        borderWidth: 1,
        borderColor: COLORS.border,
      },
      elevated: {
        ...SHADOWS.md,
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
    };
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[getCardStyle(), style]}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[getCardStyle(), style]}>{children}</View>;
}
