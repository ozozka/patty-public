import React, { useEffect, useRef, useState } from 'react';
import type {
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Config } from 'src/Config';
import { androidTextProps } from 'src/utils/platform';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  testID?: string;
}

export function OtpInput({
  value,
  onChange,
  error,
  disabled,
  autoFocus,
  testID = 'otp-input',
}: OtpInputProps) {
  const { theme } = useUnistyles();
  const inputs = useRef<TextInput[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const translateX = useSharedValue(0);

  useEffect(() => {
    if (error) {
      const { fast } = Config.animation.duration;
      translateX.value = withSequence(
        withTiming(-10, { duration: fast }),
        withRepeat(withTiming(10, { duration: fast }), 3, true),
        withTiming(0, { duration: fast }),
      );
    }
  }, [error, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (autoFocus && inputs.current[0]) {
      timer = setTimeout(() => {
        inputs.current[0]?.focus();
      }, 100);
      if (timer.unref) timer.unref();
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [autoFocus]);

  const handleChangeText = (text: string, index: number) => {
    const newValue = value.split('');
    const char = text.slice(-1);
    newValue[index] = char;
    const finalValue = newValue.join('');
    onChange(finalValue);

    if (char && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const getInputStyle = (index: number) => {
    if (error) return styles.inputError;
    if (focusedIndex === index) return styles.inputFocused;
    return styles.inputDefault;
  };

  return (
    <Animated.View style={animatedStyle} testID={testID}>
      <View style={styles.container}>
        {([0, 1, 2, 3, 4, 5] as const).map((i) => (
          <View key={i} style={[styles.inputWrap, getInputStyle(i)]}>
            <TextInput
              testID={`${testID}-field-${i}`}
              ref={(ref) => {
                if (ref) inputs.current[i] = ref;
              }}
              style={styles.input}
              {...androidTextProps}
              maxLength={1}
              keyboardType="number-pad"
              onChangeText={(text) => handleChangeText(text, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              onFocus={() => setFocusedIndex(i)}
              onBlur={() => setFocusedIndex(null)}
              value={value[i] ?? ''}
              placeholder="0"
              placeholderTextColor={theme.colors.TEXT_MUTED}
              editable={!disabled}
              selectTextOnFocus
              autoFocus={i === 0 && autoFocus}
            />
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    width: '100%',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  inputWrap: {
    height: theme.heights.control,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.sm,
    backgroundColor: theme.colors.SURFACE,
  },
  inputDefault: {
    borderColor: theme.colors.BORDER,
  },
  inputFocused: {
    borderColor: theme.colors.PRIMARY,
  },
  inputError: {
    borderColor: theme.colors.ERROR,
  },
  input: {
    width: '100%',
    textAlign: 'center',
    ...theme.typography.heading,
    color: theme.colors.TEXT,
  },
}));
