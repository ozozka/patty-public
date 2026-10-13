/**
 * Generic tag/badge component for displaying labels with icons.
 * Can be used for traits, badges, labels, and status indicators.
 */
import React from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import type { LucideIcon } from 'src/lib/icons';
import { androidTextProps } from 'src/utils/platform';

export interface TagProps {
  /** Lucide icon component to display */
  icon: LucideIcon;
  /** Text label to display */
  label: string;
  /** Text color style */
  style?: StyleProp<TextStyle>;
  /** Background color style */
  bgStyle?: StyleProp<ViewStyle>;
  /** Optional test ID for testing */
  testID?: string;
  /** Optional custom styles for the container */
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * A pill-shaped tag component for displaying information with an icon.
 */
export function Tag({
  icon: Icon,
  label,
  style,
  bgStyle,
  testID,
  containerStyle,
}: TagProps) {
  const { theme } = useUnistyles();

  return (
    <View style={[styles.container, bgStyle, containerStyle]} testID={testID}>
      <Icon size={14} color={theme.colors.TEXT_ON_IMAGE} style={style} />
      <Text
        style={[styles.text, style]}
        {...androidTextProps}
        allowFontScaling={false}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.OVERLAY + '66',
  },
  text: {
    ...theme.typography.caption,
    fontWeight: 'bold',
    marginLeft: theme.spacing.xs,
    color: theme.colors.TEXT_ON_IMAGE,
  },
}));
