/**
 * Component to handle keyboard-aware layout adjustments across iOS and Android.
 */

import React from 'react';
import type { RefreshControlProps, StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StyleSheet } from 'react-native-unistyles';

export interface KeyboardShiftProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Distance between the bottom of the screen and the input.
   * Standardized for both platforms with keyboard-controller.
   */
  verticalOffset?: number;
  /**
   * Whether to enable the keyboard aware scroll view.
   * Defaults to true.
   */
  enabled?: boolean;
  /**
   * Extra space between the keyboard and the focused input.
   * Recommended: 40px for breathing room.
   */
  bottomOffset?: number;
  /**
   * Optional accessory bar to render above the keyboard.
   */
  accessoryBar?: React.ReactNode;
  /**
   * Dismiss the keyboard on drag.
   * Recommended for lists and chat.
   */
  keyboardDismissMode?: 'none' | 'on-drag' | 'interactive';
  /**
   * Optional refresh control for pull-to-refresh.
   */
  refreshControl?: React.ReactElement<RefreshControlProps>;
  /**
   * Style for the content container.
   */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Whether to center content.
   */
  center?: boolean;
  /**
   * Additional padding at the bottom of the content.
   */
  contentPaddingBottom?: number;
}

/**
 * A wrapper that pushes content up when the keyboard is visible.
 * Standardizes the inconsistent behavior between iOS and Android
 * using react-native-keyboard-controller.
 */
const KeyboardShift = ({
  children,
  style,
  verticalOffset = 0,
  enabled = true,
  bottomOffset = 40,
  accessoryBar,
  keyboardDismissMode = 'none',
  refreshControl,
  contentContainerStyle,
  center = false,
  contentPaddingBottom,
}: KeyboardShiftProps) => {
  if (!enabled) {
    return (
      <View style={[styles.flex1, center && styles.center, style]}>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.flex1, center && styles.center]}>
      <KeyboardAwareScrollView
        bottomOffset={bottomOffset}
        extraKeyboardSpace={verticalOffset}
        style={[styles.flex1, style]}
        contentContainerStyle={[
          styles.contentContainer,
          contentPaddingBottom !== undefined && {
            paddingBottom: contentPaddingBottom,
          },
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={keyboardDismissMode}
        refreshControl={refreshControl}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        overScrollMode="never"
      >
        {children}
      </KeyboardAwareScrollView>
      {accessoryBar}
    </View>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flexGrow: 1,
  },
});

export { KeyboardShift };
