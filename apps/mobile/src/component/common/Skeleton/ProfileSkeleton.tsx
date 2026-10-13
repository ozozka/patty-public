/**
 * Skeleton for profile screen matching InfoTab layout.
 */
import React from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Card } from 'src/component/common/Card';

import { Skeleton } from './Skeleton';
import { SkeletonCircle } from './SkeletonCircle';

export function ProfileSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SkeletonCircle size={100} />
        <View style={styles.headerText}>
          <Skeleton width="60%" height={24} radius="sm" />
          <View style={styles.headerSub}>
            <Skeleton width="40%" height={16} radius="sm" />
          </View>
        </View>
      </View>

      <View style={styles.completionCard}>
        <Card variant="flat" padding="md">
          <View style={styles.completionRow}>
            <Skeleton width={20} height={20} radius="sm" />
            <View style={styles.completionText}>
              <Skeleton width="50%" height={16} radius="sm" />
            </View>
          </View>
          <Skeleton width="100%" height={8} radius="xs" />
        </Card>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Skeleton width={20} height={20} radius="sm" />
          <View style={styles.statValue}>
            <Skeleton width={30} height={24} radius="sm" />
          </View>
          <Skeleton width={50} height={12} radius="sm" />
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Skeleton width={20} height={20} radius="sm" />
          <View style={styles.statValue}>
            <Skeleton width={30} height={24} radius="sm" />
          </View>
          <Skeleton width={50} height={12} radius="sm" />
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Skeleton width={20} height={20} radius="sm" />
          <View style={styles.statValue}>
            <Skeleton width={30} height={24} radius="sm" />
          </View>
          <Skeleton width={50} height={12} radius="sm" />
        </View>
      </View>

      <View style={styles.petsSection}>
        <View style={styles.petsTitle}>
          <Skeleton width={80} height={14} radius="sm" />
        </View>
        <View style={styles.petsRow}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.petItem}>
              <SkeletonCircle size={60} />
              <View style={styles.petName}>
                <Skeleton width={50} height={12} radius="sm" />
              </View>
            </View>
          ))}
        </View>
      </View>

      <Card variant="flat">
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={i < 4 ? styles.infoItem : styles.infoItemLast}>
            <View style={styles.infoLabelWrap}>
              <Skeleton width={60} height={12} radius="sm" />
            </View>
            <Skeleton width="80%" height={16} radius="sm" />
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  headerText: {
    flex: 1,
    marginLeft: theme.spacing.lg,
  },
  headerSub: {
    marginTop: theme.spacing.sm,
  },
  completionCard: {
    marginBottom: theme.spacing.xl,
  },
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  completionText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    marginVertical: theme.spacing.xs,
  },
  statDivider: {
    width: theme.borderWidth.sm,
    height: theme.heights.row,
    backgroundColor: theme.colors.BORDER,
    opacity: 0.5,
  },
  petsSection: {
    marginBottom: theme.spacing.xl,
  },
  petsTitle: {
    marginBottom: theme.spacing.md,
    marginLeft: theme.spacing.xs,
  },
  petsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  petItem: {
    alignItems: 'center',
  },
  petName: {
    marginTop: theme.spacing.xs,
  },
  infoItem: {
    paddingVertical: theme.spacing.xs,
    marginBottom: theme.spacing.xl,
  },
  infoItemLast: {
    paddingVertical: theme.spacing.xs,
  },
  infoLabelWrap: {
    marginBottom: theme.spacing.xs,
  },
}));
