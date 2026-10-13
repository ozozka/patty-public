import React from 'react';
import { Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

interface DetailsRowProps {
  label: string;
  value: string | undefined | null;
}

export function DetailsRow({ label, value }: DetailsRowProps) {
  const { theme } = useUnistyles();
  if (!value) return null;

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, { color: theme.colors.TEXT_MUTED }]}>
          {label}
        </Text>
      </View>
      <View style={styles.valueContainer}>
        <Text style={[styles.value, { color: theme.colors.TEXT }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: 'row',
    borderBottomWidth: theme.borderWidth.sm,
    borderBottomColor: theme.colors.BORDER,
    paddingVertical: theme.spacing.xs,
  },
  labelContainer: {
    flex: 1,
  },
  valueContainer: {
    flex: 2,
  },
  label: {
    ...theme.typography.label,
  },
  value: {
    ...theme.typography.body,
    textAlign: 'right',
  },
}));
