/**
 * Centered dialog component for alerts, confirmations, and custom content.
 * Replaces the AppAlert pattern with a declarative component API.
 */
import React from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { Config } from 'src/Config';

export type DialogButtonStyle = 'default' | 'cancel' | 'destructive';

export interface DialogButton {
  text: string;
  onPress?: () => void | Promise<void>;
  style?: DialogButtonStyle;
}

export interface DialogProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  buttons?: DialogButton[];
  children?: React.ReactNode;
  closeOnBackdropPress?: boolean;
  testID?: string;
}

const DIALOG_DURATION = Config.animation.duration.regular;

export function Dialog({
  visible,
  onClose,
  title,
  message,
  buttons = [],
  children,
  closeOnBackdropPress = true,
  testID,
}: DialogProps) {
  if (!visible) return null;

  const handleButtonPress = (btn: DialogButton) => {
    onClose();
    void btn.onPress?.();
  };

  const getButtonStyle = (btnStyle?: DialogButtonStyle) => {
    switch (btnStyle) {
      case 'destructive':
        return styles.buttonDestructive;
      case 'cancel':
        return styles.buttonCancel;
      case 'default':
      case undefined:
        return styles.buttonDefault;
    }
  };

  const getButtonTextStyle = (btnStyle?: DialogButtonStyle) => {
    if (btnStyle === 'cancel') return styles.buttonTextCancel;
    return styles.buttonTextDefault;
  };

  return (
    <View style={styles.container} testID={testID}>
      <Animated.View
        entering={FadeIn.duration(DIALOG_DURATION)}
        exiting={FadeOut.duration(DIALOG_DURATION)}
        style={styles.overlay}
      >
        {closeOnBackdropPress && (
          <Pressable
            testID={`${testID}-backdrop`}
            style={styles.flex1}
            onPress={onClose}
          />
        )}
      </Animated.View>

      <Animated.View
        entering={FadeIn.duration(DIALOG_DURATION)}
        exiting={FadeOut.duration(DIALOG_DURATION)}
        style={styles.card}
      >
        {children ?? (
          <View style={styles.body}>
            {title && (
              <View style={styles.titleWrap}>
                <Text style={styles.title}>{title}</Text>
              </View>
            )}
            {message && (
              <View style={styles.messageWrap}>
                <Text style={styles.message}>{message}</Text>
              </View>
            )}

            {buttons.length > 0 && (
              <View
                style={
                  buttons.length > 2 ? styles.buttonsColumn : styles.buttonsRow
                }
              >
                {buttons.map((btn, index) => (
                  <TouchableOpacity
                    testID={`${testID}-button-${index}`}
                    key={btn.text}
                    style={[
                      styles.button,
                      getButtonStyle(btn.style),
                      buttons.length <= 2 && styles.flex1,
                    ]}
                    onPress={() => handleButtonPress(btn)}
                  >
                    <Text
                      style={[styles.buttonText, getButtonTextStyle(btn.style)]}
                    >
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: theme.zIndex.max,
    elevation: theme.zIndex.max,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing['2xl'],
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.OVERLAY,
  },
  flex1: {
    flex: 1,
  },
  card: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.SURFACE,
    ...theme.getShadow(3),
  },
  body: {
    padding: theme.spacing.lg,
  },
  titleWrap: {
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.heading,
    textAlign: 'center',
    color: theme.colors.TEXT,
  },
  messageWrap: {
    marginBottom: theme.spacing['2xl'],
  },
  message: {
    ...theme.typography.body,
    textAlign: 'center',
    color: theme.colors.TEXT_SECONDARY,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  buttonsColumn: {
    gap: theme.spacing.md,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  buttonDefault: {
    backgroundColor: theme.colors.PRIMARY,
  },
  buttonDestructive: {
    backgroundColor: theme.colors.ERROR,
  },
  buttonCancel: {
    borderWidth: theme.borderWidth.sm,
    borderColor: theme.colors.BORDER,
  },
  buttonText: {
    ...theme.typography.button,
  },
  buttonTextDefault: {
    color: theme.colors.ON_PRIMARY,
  },
  buttonTextCancel: {
    color: theme.colors.TEXT_SECONDARY,
  },
}));
