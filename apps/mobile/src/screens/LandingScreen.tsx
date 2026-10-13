/** Source file for LandingScreen. */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet as RNStyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { AppIcon } from 'src/component/common/AppIcon';
import { ScreenContainer } from 'src/component/common/ScreenContainer';
import { Config } from 'src/Config';
import { useTheme } from 'src/hooks/ui/useTheme';

export function LandingScreen() {
  const { colors } = useTheme();
  const floatAnim = useSharedValue(0);

  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: Config.animation.duration.crawl }),
        withTiming(0, { duration: Config.animation.duration.crawl }),
      ),
      -1,
      true,
    );
  }, [floatAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }],
  }));

  return (
    <ScreenContainer
      scroll={false}
      background={
        <LinearGradient
          colors={colors.GRADIENT_HEADER}
          style={RNStyleSheet.absoluteFill}
        />
      }
    >
      <View style={styles.centered}>
        <Animated.View style={[animatedStyle]}>
          <View style={styles.iconWrap}>
            <AppIcon />
          </View>
        </Animated.View>
        <Animated.View
          entering={FadeIn.delay(Config.animation.delay.normal).duration(
            Config.animation.duration.leisurely,
          )}
        >
          <Text style={styles.title}>{Config.app.NAME}</Text>
        </Animated.View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create((theme) => ({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.ON_PRIMARY,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
}));
