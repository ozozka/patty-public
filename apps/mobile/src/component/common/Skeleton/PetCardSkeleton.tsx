/**
 * Skeleton for pet card matching ProfilePetCard layout.
 */
import React from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Card } from 'src/component/common/Card';

import { Skeleton } from './Skeleton';

export function PetCardSkeleton() {
  return (
    <View style={styles.container}>
      <Card variant="elevated" padding={0}>
        <Skeleton width="100%" height={180} radius={0} />
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Skeleton width="50%" height={16} radius="sm" />
            <Skeleton width={40} height={12} radius="sm" />
          </View>
          <Skeleton width="70%" height={14} radius="sm" />
        </View>
      </Card>
    </View>
  );
}

export function PetCardSkeletonList({ count = 2 }: { count?: number }) {
  const skeletonKeyPrefix = React.useId();
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <PetCardSkeleton key={`${skeletonKeyPrefix}-${index}`} />
      ))}
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    marginBottom: theme.spacing.md,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
}));
