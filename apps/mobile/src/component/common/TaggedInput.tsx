/** Source file for TaggedInput. */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  DimensionValue,
  KeyboardTypeOptions,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Config } from 'src/Config';
import { androidTextProps } from 'src/utils/platform';

const SLASH = '/';
const FOOTER_MIN_HEIGHT = 64;

export interface TaggedInputProps {
  width?: DimensionValue;
  height?: DimensionValue;
  placeholder?: string;
  boxStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  label?: string;
  labelStyle?: StyleProp<TextStyle>;
  error?: string;
  errorStyle?: StyleProp<TextStyle>;
  toggle?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  autoComplete?:
    | 'username'
    | 'email'
    | 'password'
    | 'new-password'
    | 'off'
    | 'tel'
    | 'postal-code';
  autoFocus?: boolean;
  focusColor?: string;
  boxColor?: string;
  onChangeText?: (text: string) => void;
  values?: string;
  rightElement?: React.ReactNode;
  maxLength?: number;
  variant?: 'outline' | 'filled';
  testID?: string;
}

export function TaggedInput({
  width,
  height,
  placeholder,
  boxStyle,
  inputStyle,
  label,
  labelStyle,
  error,
  errorStyle: _errorStyle,
  toggle,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  autoComplete,
  autoFocus,
  focusColor,
  boxColor,
  onChangeText,
  values,
  rightElement,
  maxLength,
  variant = 'outline',
  testID,
}: TaggedInputProps) {
  const { theme } = useUnistyles();
  const { t } = useTranslation();
  const [checkIconTF, setIconTF] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  useEffect(() => {
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
          [boxColor ?? theme.colors.BORDER, focusColor ?? theme.colors.PRIMARY],
        );

    return { borderColor };
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

  const checkIcon = () => {
    setIconTF(!checkIconTF);
  };

  return (
    <View style={[styles.wrapper, { width: width ?? '100%' }]}>
      {label && (
        <View style={styles.labelWrap}>
          <Animated.Text style={[styles.label, labelStyle, animatedLabelStyle]}>
            {label}
          </Animated.Text>
        </View>
      )}
      <Animated.View
        style={[
          styles.inputRow,
          variant === 'filled' ? styles.inputFilled : styles.inputOutline,
          variant === 'outline' && animatedBoxStyle,
          boxStyle,
          { height: height ?? theme.heights.control },
        ]}
      >
        <TextInput
          testID={`${testID}-input`}
          {...androidTextProps}
          style={[styles.input, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.TEXT_MUTED}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          secureTextEntry={toggle ? checkIconTF : false}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChangeText={onChangeText}
          value={values}
          maxLength={maxLength}
        />
        {rightElement}
        {toggle && (
          <TouchableOpacity
            testID={`${testID}-toggle`}
            onPress={checkIcon}
            style={styles.toggle}
            activeOpacity={0.7}
          >
            <Text
              style={styles.toggleText}
              {...androidTextProps}
              allowFontScaling={false}
            >
              {checkIconTF ? t('common.show') : t('common.hide')}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      <View
        style={[
          styles.footer,
          error || maxLength !== undefined
            ? styles.footerVisible
            : styles.footerHidden,
        ]}
      >
        {error ? <Text style={styles.errorText}>{error}</Text> : <View />}

        {maxLength !== undefined && (
          <Text style={styles.counterText}>
            {values?.length ?? 0}
            {SLASH}
            {maxLength}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrapper: {
    marginVertical: theme.spacing.sm,
  },
  labelWrap: {
    marginBottom: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.TEXT,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
  },
  inputOutline: {
    borderWidth: theme.borderWidth.sm,
    borderColor: theme.colors.BORDER,
    backgroundColor: theme.colors.SURFACE,
  },
  inputFilled: {
    borderWidth: 0,
    backgroundColor: theme.colors.SURFACE_SUNKEN,
  },
  input: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.TEXT,
  },
  toggle: {
    flexShrink: 0,
  },
  toggleText: {
    ...theme.typography.caption,
    paddingHorizontal: theme.spacing.sm,
    color: theme.colors.PRIMARY,
  },
  footer: {
    marginTop: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xs,
  },
  footerVisible: {
    minHeight: FOOTER_MIN_HEIGHT,
  },
  footerHidden: {
    minHeight: 0,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.ERROR,
  },
  counterText: {
    ...theme.typography.caption,
    color: theme.colors.TEXT_MUTED,
  },
}));
