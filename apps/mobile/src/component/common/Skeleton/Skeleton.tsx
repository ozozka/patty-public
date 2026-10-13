/**
 * Base skeleton component with shimmer animation.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Config } from 'src/Config';

const SHIMMER_GRADIENT_WIDTH = 200;

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A standard placeholder component for loading states.
 * Features a high-performance shimmer animation via Reanimated.
 */
export function Skeleton({
  width = '100%',
  height = 20,
  radius = 'md',
  style,
}: SkeletonProps) {
  const { theme } = useUnistyles();
  const translateX = useSharedValue(-200);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(200, { duration: Config.animation.duration.slow }),
      -1,
    );
  }, [translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const getRadiusStyle = () => {
    if (typeof radius === 'number') return { borderRadius: radius };
    const radiusMap: Record<string, number> = {
      xs: theme.borderRadius.xs,
      sm: theme.borderRadius.sm,
      md: theme.borderRadius.md,
      lg: theme.borderRadius.lg,
      xl: theme.borderRadius.xl,
      full: theme.borderRadius.full,
    };
    return { borderRadius: radiusMap[radius] ?? theme.borderRadius.md };
  };

  return (
    <View
      style={[
        styles.container,
        { width, height },
        getRadiusStyle(),
        { backgroundColor: theme.colors.TRANSPARENT_INPUT },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmerContainer, animatedStyle]}>
        <LinearGradient
          colors={['transparent', theme.colors.SURFACE_ELEVATED, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    width: SHIMMER_GRADIENT_WIDTH,
    flex: 1,
  },
  container: {
    overflow: 'hidden',
  },
});
