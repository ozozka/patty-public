/**
 * Circular skeleton for avatars and icons.
 */
import type { StyleProp, ViewStyle } from 'react-native';

import { Skeleton } from './Skeleton';

export interface SkeletonCircleProps {
  size: number;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonCircle({ size, style }: SkeletonCircleProps) {
  return (
    <Skeleton width={size} height={size} radius={size / 2} style={style} />
  );
}
