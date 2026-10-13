/**
 * Static design tokens — theme-independent values.
 * Single source of truth for spacing, typography, borders, sizes, shadows, and z-index.
 */

import { Platform } from 'react-native';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

export const typography = {
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: 'Nunito_700Bold',
  },
  heading: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'Nunito_700Bold',
    letterSpacing: 0.5,
  },
  display: {
    fontSize: 30,
    lineHeight: 38,
    fontFamily: 'Nunito_700Bold',
  },
  sectionHeader: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: 'Nunito_600SemiBold',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  button: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter_600SemiBold',
  },
  label: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontSize: 9,
    lineHeight: 14,
    fontFamily: 'Inter_400Regular',
  },
} as const;

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  full: 9999,
} as const;

export const borderWidth = {
  sm: 1,
  md: 1.5,
  lg: 2,
  '2xl': 4,
} as const;

export const sizes = {
  iconSm: 16,
  icon: 24,
  iconLg: 40,
  badge: 8,
  badgeLg: 12,
  avatarSm: 40,
  avatar: 56,
  avatarLg: 80,
  avatarXl: 120,
  actionSm: 50,
  action: 60,
} as const;

export const heights = {
  indicator: 5,
  row: 30,
  buttonSm: 35,
  control: 50,
  buttonLg: 60,
} as const;

export const zIndex = {
  base: 1,
  dropdown: 10,
  sticky: 20,
  modal: 50,
  toast: 60,
  tooltip: 70,
  overlay: 100,
  max: 9999,
} as const;

/**
 * Platform-aware shadow utility.
 * @param intensity 1-5 scale for shadow depth.
 * @param color Optional shadow color (defaults to black).
 */
export const getShadow = (intensity: number = 1, color: string = '#000') => {
  if (Platform.OS === 'android') {
    return { elevation: intensity * 2 };
  }
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: intensity },
    shadowOpacity: 0.1 * intensity,
    shadowRadius: intensity * 2,
  };
};
