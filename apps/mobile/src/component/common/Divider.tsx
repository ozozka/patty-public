/**
 * A reusable Divider component.
 */
import React, { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

export interface DividerProps {
  spacing?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Divider({ spacing, color, style, testID }: DividerProps) {
  const { theme } = useUnistyles();

  const inlineStyles = useMemo(() => {
    const s: ViewStyle = {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.BORDER,
      width: '100%',
    };
    if (spacing) {
      s.marginVertical = spacing;
    }
    if (color) {
      s.backgroundColor = color;
    }
    return s;
  }, [spacing, color, theme.colors.BORDER]);

  return <View testID={testID} style={[inlineStyles, style]} />;
}
