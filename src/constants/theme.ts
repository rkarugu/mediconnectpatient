// Design System - Theme Constants
// MediConnect Brand Colors (from logo)
export const COLORS = {
  // Primary Colors - MediConnect Blue
  primary: '#2B7BB9',
  primaryDark: '#1E5A8A',
  primaryLight: '#4A9AD4',
  
  // Secondary Colors - MediConnect Green
  secondary: '#2ECC71',
  secondaryDark: '#27AE60',
  secondaryLight: '#58D68D',
  
  // Accent - Combining both brand colors
  accent: '#2ECC71',
  accentLight: '#A9DFBF',
  
  // Status Colors
  success: '#2ECC71',
  warning: '#F39C12',
  error: '#E74C3C',
  info: '#2B7BB9',
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  background: '#F5F8FA',
  backgroundDark: '#ECF0F3',
  surface: '#FFFFFF',
  
  // Text Colors
  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  textTertiary: '#95A5A6',
  textDisabled: '#BDC3C7',
  
  // Border Colors
  border: '#E0E6ED',
  borderDark: '#CBD5E1',
  
  // Medical Theme Colors
  medicalBlue: '#2B7BB9',
  medicalGreen: '#2ECC71',
  medicalRed: '#E74C3C',
  
  // Gradient Colors
  gradientStart: '#2B7BB9',
  gradientEnd: '#2ECC71',
  
  // Tab Bar
  tabBarBackground: '#FFFFFF',
  tabBarActive: '#2B7BB9',
  tabBarInactive: '#95A5A6',
};

export const TYPOGRAPHY = {
  // Font Families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Font Weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
};

export const LAYOUT = {
  screenPadding: SPACING.base,
  containerMaxWidth: 600,
  headerHeight: 60,
  tabBarHeight: 60,
  bottomSheetMinHeight: 200,
};

export const ANIMATIONS = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  LAYOUT,
  ANIMATIONS,
};
