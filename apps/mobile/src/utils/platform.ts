/**
 * Centralized platform-specific utilities.
 * Use these instead of inline Platform.OS checks in style props.
 */
import { Platform } from 'react-native';

/**
 * Android text props to fix font measurement issues.
 * Spread on Text/TextInput components: {...androidTextProps}
 */
export const androidTextProps =
  Platform.OS === 'android'
    ? ({ includeFontPadding: false } as const)
    : ({} as const);
