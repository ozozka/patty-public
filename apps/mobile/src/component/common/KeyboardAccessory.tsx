import React from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Platform, Text, TouchableOpacity, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

const ACCESSORY_HEIGHT = 44;

export interface KeyboardAccessoryProps {
  /**
   * Title for the accessory button.
   * Defaults to 'common.done'.
   */
  doneTitle?: string;
  /**
   * Custom press handler.
   * Defaults to Keyboard.dismiss().
   */
  onDone?: () => void;
  testID?: string;
}

/**
 * A standard accessory bar to render above the keyboard.
 * Primarily used on iOS for 'number-pad' inputs which lack a 'Done' button.
 */
export function KeyboardAccessory({
  doneTitle,
  onDone,
  testID,
}: KeyboardAccessoryProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  // Android usually provides a done/next button natively on the keyboard
  if (Platform.OS !== 'ios') {
    return null;
  }

  const handleDone = () => {
    if (onDone) {
      onDone();
    } else {
      Keyboard.dismiss();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        testID={`${testID}-done`}
        onPress={handleDone}
        style={styles.button}
      >
        <Text style={[styles.text, { color: theme.colors.PRIMARY }]}>
          {doneTitle ?? t('common.ok')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    height: ACCESSORY_HEIGHT,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: theme.borderWidth.sm,
    borderTopColor: theme.colors.BORDER_LIGHT,
    backgroundColor: theme.colors.SURFACE,
    paddingHorizontal: theme.spacing.md,
  },
  button: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  text: {
    ...theme.typography.button,
  },
}));
