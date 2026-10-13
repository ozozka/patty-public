/**
 * Text skeleton for simulating text lines.
 */
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';

import { Skeleton } from './Skeleton';

export interface SkeletonTextProps {
  width?: DimensionValue;
  height?: number;
  lines?: number;
  lineHeight?: number;
  lastLineWidth?: DimensionValue;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonText({
  width = '100%',
  height = 14,
  lines = 1,
  lineHeight = 22,
  lastLineWidth = '70%',
  style,
}: SkeletonTextProps) {
  if (lines === 1) {
    return <Skeleton width={width} height={height} radius="sm" style={style} />;
  }

  return (
    <>
      {Array.from({ length: lines }, (_, index) => {
        const isLast = index === lines - 1;
        const lineWidth = isLast ? lastLineWidth : width;
        return (
          <Skeleton
            key={`skeleton-line-${index}`}
            width={lineWidth}
            height={height}
            radius="sm"
            style={index > 0 ? { marginTop: lineHeight - height } : style}
          />
        );
      })}
    </>
  );
}
