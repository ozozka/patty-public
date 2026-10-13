/**
 * Theme management hook.
 *
 * Bridges the Zustand auth store (persisted preference) with Unistyles
 * runtime theme switching. Uses React Native's useColorScheme to detect
 * the system preference when theme is set to 'system'.
 */

import { Appearance, Platform, useColorScheme } from 'react-native';
import { UnistylesRuntime } from 'react-native-unistyles';
import { useUpdateTheme } from 'src/hooks/api/useUserApi';
import { useAuthStore } from 'src/store/useAuthStore';
import { darkColors } from 'src/theme/dark';
import { lightColors } from 'src/theme/light';
import type { ThemeColors } from 'src/theme/types';

export type ThemeType = 'light' | 'dark' | 'system';

/**
 * Hook to manage application theme.
 */
export const useTheme = () => {
  const theme = useAuthStore((state) => state.theme);
  const setStoreTheme = useAuthStore((state) => state.setTheme);

  const systemScheme = useColorScheme();
  const { mutate: updateTheme } = useUpdateTheme();

  let activeScheme: 'light' | 'dark';

  if (theme === 'system') {
    activeScheme = systemScheme === 'dark' ? 'dark' : 'light';
  } else {
    activeScheme = theme;
  }

  const colors: ThemeColors =
    activeScheme === 'dark' ? darkColors : lightColors;

  const setTheme = (newTheme: ThemeType) => {
    setStoreTheme(newTheme);

    const resolved =
      newTheme === 'system'
        ? Appearance.getColorScheme() === 'dark'
          ? 'dark'
          : 'light'
        : newTheme;

    UnistylesRuntime.setTheme(resolved);
  };

  const syncTheme = (newTheme: string) => {
    updateTheme(newTheme);
  };

  /**
   * Platform-aware shadow utility.
   * @param intensity 1-5 scale for shadow depth.
   * @param color Optional shadow color (defaults to black).
   */
  const getShadow = (intensity: number = 1, color: string = '#000') => {
    if (Platform.OS === 'android') {
      return { elevation: intensity * 2 };
    }
    return {
      shadowColor: color,
      shadowOffset: { width: 0, height: intensity },
      shadowOpacity: 0.1 * intensity,
      shadowRadius: intensity * 2,
    };
  };

  return {
    theme,
    activeScheme,
    colors,
    setTheme,
    syncTheme,
    getShadow,
  };
};
