/**
 * A reusable EmptyState component with animations and illustrations.
 */
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ActionButton } from 'src/component/common/ActionButton';
import { Config } from 'src/Config';
import type { LucideIcon } from 'src/lib/icons';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  actionTitle?: string;
  onAction?: () => void;
  secondaryActionTitle?: string;
  onSecondaryAction?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionTitle,
  onAction,
  secondaryActionTitle,
  onSecondaryAction,
  style,
  testID,
}: EmptyStateProps) {
  const { theme } = useUnistyles();
  const { t } = useTranslation();

  const floatAnim = useSharedValue(0);

  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: Config.animation.duration.slow }),
        withTiming(0, { duration: Config.animation.duration.slow }),
      ),
      -1,
      true,
    );
  }, [floatAnim]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }],
  }));

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.iconContainer}>
        <View style={styles.iconBackground} />
        <Animated.View style={[styles.iconWrapper, animatedIconStyle]}>
          <Icon size={64} color={theme.colors.PRIMARY} />
        </Animated.View>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.buttonsContainer}>
        {onAction && (
          <ActionButton
            testID={`${testID}-action`}
            title={actionTitle ?? t('common.retry')}
            onPress={onAction}
            style={styles.button}
          />
        )}
        {onSecondaryAction && (
          <ActionButton
            testID={`${testID}-secondary-action`}
            title={secondaryActionTitle ?? ''}
            onPress={onSecondaryAction}
            type="outline"
            style={styles.button}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    width: '100%',
    alignItems: 'center',
    padding: theme.spacing['4xl'],
  },
  iconContainer: {
    width: theme.sizes.iconLg,
    height: theme.sizes.iconLg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing['2xl'],
  },
  iconBackground: {
    position: 'absolute',
    width: theme.sizes.avatarXl,
    height: theme.sizes.avatarXl,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.SURFACE_SUNKEN,
    opacity: 0.5,
  },
  iconWrapper: {
    width: theme.sizes.icon,
    height: theme.sizes.icon,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.full,
  },
  title: {
    ...theme.typography.title,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    color: theme.colors.TEXT,
  },
  subtitle: {
    ...theme.typography.body,
    marginBottom: theme.spacing['3xl'],
    textAlign: 'center',
    color: theme.colors.TEXT_SECONDARY,
  },
  buttonsContainer: {
    width: '100%',
    gap: theme.spacing.md,
  },
  button: {
    width: '100%',
  },
}));
