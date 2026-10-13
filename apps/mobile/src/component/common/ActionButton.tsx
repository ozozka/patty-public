/** Source file for ActionButton. */
import React, { useCallback, useMemo } from 'react';
import type { TextStyle, ViewStyle } from 'react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useHaptics } from 'src/hooks/ui/useHaptics';
import type { LucideIcon } from 'src/lib/icons';
import { androidTextProps } from 'src/utils/platform';

export interface ActionButtonProps {
  title?: string;
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  loading?: boolean;
  disabled?: boolean;
  type?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ActionButton({
  title = '',
  onPress,
  style,
  textStyle,
  loading = false,
  disabled = false,
  type = 'primary',
  size = 'md',
  icon: Icon,
  testID,
}: ActionButtonProps) {
  const { theme } = useUnistyles();
  const { impactLight } = useHaptics();
  const scale = useSharedValue(1);

  const buttonStyle = useMemo(() => {
    const typeStyles: Record<string, ViewStyle> = {
      primary: { backgroundColor: theme.colors.PRIMARY },
      secondary: { backgroundColor: theme.colors.SECONDARY },
      danger: { backgroundColor: theme.colors.ERROR },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: theme.borderWidth.sm,
        borderColor: theme.colors.PRIMARY,
      },
      ghost: { backgroundColor: 'transparent' },
    };

    const sizeStyles: Record<string, ViewStyle> = {
      sm: { height: theme.heights.buttonSm, paddingHorizontal: 12 },
      md: { height: theme.heights.control, paddingHorizontal: 16 },
      lg: { height: theme.heights.buttonLg, paddingHorizontal: 20 },
    };

    return [
      styles.base,
      typeStyles[type],
      sizeStyles[size],
      (disabled || loading) && styles.disabled,
    ];
  }, [type, size, disabled, loading, theme]);

  const textColor = useMemo(() => {
    if (type === 'outline') return theme.colors.SECONDARY;
    if (type === 'ghost') return theme.colors.TEXT_SECONDARY;
    return theme.colors.ON_PRIMARY;
  }, [type, theme]);

  const textSizeStyle = useMemo((): TextStyle => {
    switch (size) {
      case 'sm':
        return { fontSize: 12, lineHeight: 18 };
      case 'md':
        return {};
      case 'lg':
        return { fontSize: 20, lineHeight: 26 };
    }
  }, [size]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = useCallback(() => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.97);
    }
  }, [disabled, loading, scale]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1);
  }, [scale]);

  const handlePress = useCallback(() => {
    if (type === 'primary' || type === 'danger') {
      impactLight();
    }
    onPress();
  }, [type, onPress, impactLight]);

  const getRippleColor = () => {
    if (type === 'outline' || type === 'ghost')
      return theme.colors.PRIMARY + '20';
    return theme.colors.ON_PRIMARY + '30';
  };

  return (
    <AnimatedPressable
      testID={testID}
      style={[buttonStyle, style, animatedStyle]}
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled || loading}
      android_ripple={{
        color: getRippleColor(),
        borderless: false,
      }}
    >
      {loading ? (
        <ActivityIndicator testID={`${testID}-loading`} color={textColor} />
      ) : (
        <>
          {Icon && (
            <View style={styles.iconWrap}>
              <Icon size={size === 'sm' ? 16 : 20} color={textColor} />
            </View>
          )}
          {title && (
            <Text
              testID={`${testID}-text`}
              style={[
                styles.text,
                textSizeStyle,
                { color: textColor },
                textStyle,
              ]}
              {...androidTextProps}
              allowFontScaling={false}
            >
              {title}
            </Text>
          )}
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: theme.spacing.sm,
    flexDirection: 'row',
    borderRadius: theme.borderRadius.full,
    ...theme.getShadow(1),
  },
  disabled: {
    opacity: 0.6,
  },
  iconWrap: {
    marginRight: theme.spacing.xs,
  },
  text: {
    ...theme.typography.button,
    textAlign: 'center',
    fontWeight: 'bold',
  },
}));
