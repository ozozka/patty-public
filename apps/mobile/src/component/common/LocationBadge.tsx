/**
 * Component for displaying a location name with a map pin icon.
 * Supports an optional distance suffix.
 */
import React from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { MapPin } from 'src/lib/icons';
import { formatDistance } from 'src/utils/formatDistance';
import { androidTextProps } from 'src/utils/platform';

interface LocationBadgeProps {
  name: string | null | undefined;
  distanceM?: number | null;
  /** Text color style */
  style?: StyleProp<TextStyle>;
}

const DISTANCE_SEPARATOR = ' • ';

export function LocationBadge({ name, distanceM, style }: LocationBadgeProps) {
  const { theme } = useUnistyles();

  if (!name) return null;

  return (
    <View style={styles.container}>
      <MapPin
        size={theme.sizes.iconSm}
        color={theme.colors.TEXT_MUTED}
        style={style}
      />
      <Text
        style={[styles.text, style]}
        {...androidTextProps}
        allowFontScaling={false}
      >
        {name}
        {distanceM != null && (
          <Text
            style={[styles.distanceText, style]}
            {...androidTextProps}
            allowFontScaling={false}
          >
            {DISTANCE_SEPARATOR}
            {formatDistance(distanceM)}
          </Text>
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  text: {
    ...theme.typography.caption,
    color: theme.colors.TEXT_MUTED,
  },
  distanceText: {
    ...theme.typography.caption,
    fontWeight: 'bold',
    color: theme.colors.TEXT_MUTED,
  },
}));
