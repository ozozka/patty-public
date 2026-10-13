/**
 * A reusable Card component with different variants.
 */
import React, { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'flat';
  padding?: string | number;
  paddingHorizontal?: string | number;
  paddingVertical?: string | number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const PADDING_MAP: Record<string, number> = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
};

const PADDING_X_MAP: Record<string, number> = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
};

const PADDING_Y_MAP: Record<string, number> = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
};

export function Card({
  children,
  variant = 'elevated',
  padding,
  paddingHorizontal,
  paddingVertical,
  style,
  testID,
}: CardProps) {
  const { theme } = useUnistyles();

  const cardStyle = useMemo(() => {
    const styles: ViewStyle = {
      overflow: 'hidden',
      borderRadius: theme.borderRadius.xl,
    };

    // Variant styles
    if (variant === 'outlined') {
      styles.backgroundColor = 'transparent';
      styles.borderWidth = 1;
      styles.borderColor = theme.colors.BORDER;
    } else if (variant === 'elevated') {
      styles.backgroundColor = theme.colors.SURFACE;
      styles.shadowColor = '#000';
      styles.shadowOffset = { width: 0, height: 1 };
      styles.shadowOpacity = 0.05;
      styles.shadowRadius = 2;
      styles.elevation = 2;
    } else {
      styles.backgroundColor = theme.colors.SURFACE;
    }

    // Padding styles
    if (typeof padding === 'number') {
      styles.padding = padding;
    } else if (typeof padding === 'string' && PADDING_MAP[padding]) {
      styles.padding = PADDING_MAP[padding];
    } else if (
      padding === undefined &&
      paddingHorizontal === undefined &&
      paddingVertical === undefined
    ) {
      // Defaults: 24px horizontal (2xl), 16px vertical (lg)
      styles.paddingHorizontal = theme.spacing['2xl'];
      styles.paddingVertical = theme.spacing.lg;
    }

    if (typeof paddingHorizontal === 'number') {
      styles.paddingHorizontal = paddingHorizontal;
    } else if (
      typeof paddingHorizontal === 'string' &&
      PADDING_X_MAP[paddingHorizontal]
    ) {
      styles.paddingHorizontal = PADDING_X_MAP[paddingHorizontal];
    }

    if (typeof paddingVertical === 'number') {
      styles.paddingVertical = paddingVertical;
    } else if (
      typeof paddingVertical === 'string' &&
      PADDING_Y_MAP[paddingVertical]
    ) {
      styles.paddingVertical = PADDING_Y_MAP[paddingVertical];
    }

    return styles;
  }, [variant, padding, paddingHorizontal, paddingVertical, theme]);

  return (
    <View testID={testID} style={[cardStyle, style]}>
      {children}
    </View>
  );
}
