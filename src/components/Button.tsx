import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BORDER_RADIUS.md,
      ...SHADOWS.sm,
    };

    // Size styles
    const sizeStyles: Record<string, ViewStyle> = {
      sm: {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.base,
        minHeight: 36,
      },
      md: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        minHeight: 48,
      },
      lg: {
        paddingVertical: SPACING.base,
        paddingHorizontal: SPACING.xl,
        minHeight: 56,
      },
    };

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: COLORS.primary,
      },
      secondary: {
        backgroundColor: COLORS.secondary,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: COLORS.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      danger: {
        backgroundColor: COLORS.error,
      },
    };

    const disabledStyle: ViewStyle = isDisabled
      ? {
          backgroundColor: COLORS.backgroundDark,
          borderColor: COLORS.border,
          opacity: 0.6,
        }
      : {};

    const widthStyle: ViewStyle = fullWidth ? { width: '100%' } : {};

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...disabledStyle,
      ...widthStyle,
    };
  };

  const getTextStyle = (): TextStyle => {
    const sizeStyles: Record<string, TextStyle> = {
      sm: {
        fontSize: TYPOGRAPHY.fontSize.sm,
      },
      md: {
        fontSize: TYPOGRAPHY.fontSize.base,
      },
      lg: {
        fontSize: TYPOGRAPHY.fontSize.lg,
      },
    };

    const variantStyles: Record<string, TextStyle> = {
      primary: {
        color: COLORS.white,
      },
      secondary: {
        color: COLORS.white,
      },
      outline: {
        color: COLORS.primary,
      },
      ghost: {
        color: COLORS.primary,
      },
      danger: {
        color: COLORS.white,
      },
    };

    const disabledStyle: TextStyle = isDisabled
      ? {
          color: COLORS.textDisabled,
        }
      : {};

    return {
      fontWeight: TYPOGRAPHY.fontWeight.semiBold,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...disabledStyle,
    };
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[getButtonStyle(), style]}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.white}
          size="small"
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && <>{icon}</>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && <>{icon}</>}
        </>
      )}
    </TouchableOpacity>
  );
}
