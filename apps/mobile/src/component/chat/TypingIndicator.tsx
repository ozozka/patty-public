import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Config } from 'src/Config';

const DOT_SIZE = 6;

interface DotProps {
  delay: number;
  color: string;
}

const Dot = React.memo(function Dot({ delay, color }: DotProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: Config.animation.duration.moderate }),
          withTiming(0.3, { duration: Config.animation.duration.moderate }),
        ),
        -1,
        true,
      ),
    );
  }, [opacity, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.dotWrapper}>
      <Animated.View
        style={[styles.dot, { backgroundColor: color }, animatedStyle]}
      />
    </View>
  );
});

interface TypingIndicatorProps {
  color?: string;
}

export function TypingIndicator({ color }: TypingIndicatorProps) {
  const { theme } = useUnistyles();
  const dotColor = color ?? theme.colors.TEXT_MUTED;

  return (
    <View style={styles.container}>
      <Dot delay={0} color={dotColor} />
      <Dot delay={200} color={dotColor} />
      <Dot delay={400} color={dotColor} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    height: theme.heights.indicator,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  dotWrapper: {
    marginHorizontal: theme.spacing.xs,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: theme.borderRadius.xs,
  },
}));
