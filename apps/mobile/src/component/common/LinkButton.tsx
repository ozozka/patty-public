/** Source file for LinkButton. */
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text, TouchableOpacity } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { androidTextProps } from 'src/utils/platform';

export interface LinkButtonProps {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  testID?: string;
}

export function LinkButton({
  title,
  onPress,
  style,
  disabled,
  testID,
}: LinkButtonProps) {
  const { theme } = useUnistyles();

  return (
    <TouchableOpacity
      testID={testID}
      style={[styles.container, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text
        style={[styles.text, { color: theme.colors.PRIMARY }]}
        {...androidTextProps}
        allowFontScaling={false}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
  },
  text: {
    ...theme.typography.body,
  },
}));
