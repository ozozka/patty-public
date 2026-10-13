/**
 * Tab item component for profile screen navigation.
 * Extracted from ProfileScreen for reusability and better performance.
 */
import React, { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import type { LucideIcon } from 'src/lib/icons';

export interface TabItemProps {
  /** Tab identifier */
  name: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Display label */
  label: string;
  /** Whether this tab is currently active */
  isActive: boolean;
  /** Callback when tab is pressed */
  onPress: () => void;
}

/**
 * Individual tab item for profile navigation.
 * Uses React.memo for performance optimization.
 */
export const TabItem = memo(function TabItem({
  icon: Icon,
  label,
  isActive,
  onPress,
}: TabItemProps) {
  const { theme } = useUnistyles();

  return (
    <TouchableOpacity
      testID={`profile-tab-${label.toLowerCase().replace(/\s+/g, '-')}`}
      onPress={onPress}
      style={[styles.tab, isActive ? styles.tabActive : styles.tabInactive]}
    >
      <View style={styles.tabContent}>
        <Icon
          size={20}
          color={isActive ? theme.colors.PRIMARY : theme.colors.GRAY}
          strokeWidth={isActive ? 2.5 : 2}
        />
        <View style={styles.labelWrap}>
          <Text
            style={[
              styles.label,
              isActive ? styles.labelActive : styles.labelInactive,
            ]}
          >
            {label}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create((theme) => ({
  tab: {
    flex: 1,
    borderBottomWidth: theme.borderWidth.lg,
  },
  tabActive: {
    borderBottomColor: theme.colors.PRIMARY,
  },
  tabInactive: {
    borderBottomWidth: 0,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
  },
  labelWrap: {
    marginTop: theme.spacing.xs,
  },
  label: {
    ...theme.typography.caption,
  },
  labelActive: {
    fontWeight: 'bold',
    color: theme.colors.PRIMARY,
  },
  labelInactive: {
    color: theme.colors.GRAY,
  },
}));
