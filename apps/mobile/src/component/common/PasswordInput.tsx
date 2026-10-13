/** Password input component with icon toggle for show/hide */
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Config } from 'src/Config';
import { Eye, EyeOff } from 'src/lib/icons';
import { androidTextProps } from 'src/utils/platform';

const SLASH = '/';
const TEXT_INPUT_BASE_STYLE = {
  flex: 1,
  fontFamily: 'Inter_400Regular',
  fontSize: 16,
};

export interface PasswordInputProps<
  TFieldValues extends FieldValues,
> extends Omit<
  PasswordInputBaseProps,
  'values' | 'onChangeText' | 'rightElement'
> {
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  rules?: object;
}

interface PasswordInputBaseProps {
  placeholder?: string;
  label?: string;
  error?: string;
  keyboardType?: never;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  autoComplete?: 'password' | 'new-password' | 'off';
  autoFocus?: boolean;
  onChangeText?: (text: string) => void;
  values?: string;
  maxLength?: number;
  variant?: 'outline' | 'filled';
  testID?: string;
}

function PasswordInputBase({
  placeholder,
  label,
  error,
  autoCapitalize,
  autoCorrect,
  autoComplete,
  autoFocus,
  onChangeText,
  values,
  maxLength,
  variant = 'outline',
  testID,
}: PasswordInputBaseProps) {
  const { theme } = useUnistyles();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  React.useEffect(() => {
    focusAnim.value = withTiming(isFocused ? 1 : 0, {
      duration: Config.animation.duration.regular,
    });
  }, [isFocused, focusAnim]);

  const animatedBoxStyle = useAnimatedStyle(() => {
    const borderColor = error
      ? theme.colors.ERROR
      : interpolateColor(
          focusAnim.value,
          [0, 1],
          [theme.colors.BORDER, theme.colors.PRIMARY],
        );

    return {
      borderColor,
    };
  });

  const animatedLabelStyle = useAnimatedStyle(() => {
    const color = error
      ? theme.colors.ERROR
      : interpolateColor(
          focusAnim.value,
          [0, 1],
          [theme.colors.TEXT_MUTED, theme.colors.PRIMARY],
        );

    return { color };
  });

  const togglePasswordVisibility = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPasswordVisible((prev) => !prev);
  };

  const inputBaseStyle = {
    ...TEXT_INPUT_BASE_STYLE,
    color: theme.colors.TEXT,
  };

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelWrap}>
          <Animated.Text style={[styles.label, animatedLabelStyle]}>
            {label}
          </Animated.Text>
        </View>
      )}
      <Animated.View
        style={[
          styles.inputContainer,
          variant === 'filled' ? styles.inputFilled : styles.inputOutline,
          variant === 'outline' ? animatedBoxStyle : null,
        ]}
      >
        <TextInput
          testID={`${testID}-input`}
          {...androidTextProps}
          style={inputBaseStyle}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.TEXT_MUTED}
          keyboardType="default"
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          secureTextEntry={!isPasswordVisible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChangeText={onChangeText}
          value={values}
          maxLength={maxLength}
        />
        <TouchableOpacity
          testID={`${testID}-toggle`}
          onPress={togglePasswordVisibility}
          style={styles.toggleButton}
          activeOpacity={0.7}
          accessibilityLabel={
            isPasswordVisible ? 'Hide password' : 'Show password'
          }
          accessibilityRole="button"
        >
          {isPasswordVisible ? (
            <Eye size={theme.sizes.icon} color={theme.colors.TEXT_MUTED} />
          ) : (
            <EyeOff size={theme.sizes.icon} color={theme.colors.TEXT_MUTED} />
          )}
        </TouchableOpacity>
      </Animated.View>

      <View
        style={[
          styles.errorContainer,
          error || maxLength !== undefined
            ? styles.errorContainerVisible
            : styles.errorContainerEmpty,
        ]}
      >
        {error ? (
          <View>
            <Animated.Text style={{ color: theme.colors.ERROR }}>
              {error}
            </Animated.Text>
          </View>
        ) : (
          <View />
        )}

        {maxLength !== undefined && (
          <Animated.Text style={{ color: theme.colors.TEXT_MUTED }}>
            {values?.length ?? 0}
            {SLASH}
            {maxLength}
          </Animated.Text>
        )}
      </View>
    </View>
  );
}

export function PasswordInput<TFieldValues extends FieldValues>({
  name,
  control,
  rules,
  ...props
}: PasswordInputProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <PasswordInputBase
          {...props}
          values={value}
          onChangeText={onChange}
          error={error ? (error.message ?? 'Required') : undefined}
        />
      )}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    marginVertical: theme.spacing.sm,
    width: '100%',
  },
  labelWrap: {
    marginBottom: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  label: {
    ...theme.typography.label,
  },
  inputContainer: {
    height: theme.heights.control,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    paddingHorizontal: theme.spacing.md,
  },
  inputOutline: {
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.sm,
    backgroundColor: theme.colors.SURFACE,
  },
  inputFilled: {
    borderRadius: theme.borderRadius.md,
    borderWidth: 0,
    backgroundColor: theme.colors.SURFACE_SUNKEN,
  },
  toggleButton: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xs,
  },
  errorContainer: {
    marginTop: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xs,
  },
  errorContainerVisible: {
    minHeight: theme.spacing.xl + theme.spacing.md,
  },
  errorContainerEmpty: {
    minHeight: 0,
  },
}));
