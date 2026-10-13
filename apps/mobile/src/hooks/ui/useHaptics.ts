import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { Platform } from 'react-native';

/**
 * Hook to provide standardized haptic feedback across the app.
 * Wraps expo-haptics with safe fallbacks and platform optimization.
 */
export function useHaptics() {
  const selection = useCallback(() => {
    // Only run on physical devices as simulators don't support haptics
    if (Platform.OS === 'web') return;
    void Haptics.selectionAsync();
  }, []);

  const impactLight = useCallback(() => {
    if (Platform.OS === 'web') return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const impactMedium = useCallback(() => {
    if (Platform.OS === 'web') return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const success = useCallback(() => {
    if (Platform.OS === 'web') return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const error = useCallback(() => {
    if (Platform.OS === 'web') return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  return {
    selection,
    impactLight,
    impactMedium,
    success,
    error,
  };
}
