/**
 * Unistyles registry — initializes themes and type augmentation.
 * Must be imported once at app entry point before any StyleSheet.create() calls.
 */

import { StyleSheet } from 'react-native-unistyles';
import { darkColors } from 'src/theme/dark';
import { lightColors } from 'src/theme/light';
import {
  borderRadius,
  borderWidth,
  getShadow,
  heights,
  sizes,
  spacing,
  typography,
  zIndex,
} from 'src/theme/tokens';

const sharedTokens = {
  spacing,
  typography,
  borderRadius,
  borderWidth,
  sizes,
  heights,
  zIndex,
  getShadow,
};

const lightTheme = {
  colors: lightColors,
  ...sharedTokens,
};

const darkTheme = {
  colors: darkColors,
  ...sharedTokens,
};

export type AppTheme = typeof lightTheme;

type AppThemes = {
  light: AppTheme;
  dark: AppTheme;
};

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  settings: {
    initialTheme: 'light',
  },
});
