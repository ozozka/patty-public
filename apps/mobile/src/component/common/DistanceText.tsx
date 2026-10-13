/**
 * Component for consistent distance formatting (meters vs kilometers).
 */
import React from 'react';
import { Text } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { formatDistance } from 'src/utils/formatDistance';

interface DistanceTextProps {
  distanceM: number | null | undefined;
}

export function DistanceText({ distanceM }: DistanceTextProps) {
  const { theme } = useUnistyles();
  const formattedDistance = formatDistance(distanceM);

  if (!formattedDistance) return null;

  return (
    <Text style={[styles.text, { color: theme.colors.TEXT_MUTED }]}>
      {formattedDistance}
    </Text>
  );
}

const styles = StyleSheet.create((theme) => ({
  text: {
    ...theme.typography.caption,
  },
}));
