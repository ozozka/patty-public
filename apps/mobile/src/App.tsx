/**
 * Main application entry point and root navigation setup.
 */

import 'src/theme/unistyles';
import 'src/polyfill';
import 'src/i18n';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { mapApiError } from 'src/api/errors';
import { AlertDialog } from 'src/component/common/AlertDialog';
import { ReportBottomSheet } from 'src/component/common/ReportBottomSheet';
import { Toast } from 'src/component/common/Toast';
import { useLocationHeartbeat } from 'src/hooks/feature/useLocationHeartbeat';
import { usePushNotifications } from 'src/hooks/feature/usePushNotifications';
import { useTheme } from 'src/hooks/ui/useTheme';
import { useAppBootstrap } from 'src/hooks/useAppBootstrap';
import { queryClient } from 'src/lib/queryClient';
import { RootNavigator } from 'src/navigation/RootNavigator';
import { useAuthStore } from 'src/store/useAuthStore';
import { useUIStore } from 'src/store/useUIStore';
import type { ApiError } from 'src/types/api';
import { getErrorMessageKey } from 'src/utils/errorMapper';
import { navigationRef } from 'src/utils/navigation';

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});

/**
 * Handle API and network errors globally.
 *
 * Three tiers:
 * 1. Proper ApiError with a message → show the message directly.
 * 2. Proper ApiError with a known error code but no message → use i18n key.
 * 3. Unknown error (network failure, ZodError, etc.) → use i18n key for INTERNAL.
 */
const handleGlobalError = (error: unknown, t: TFunction) => {
  // Only treat structured API error payloads as ApiErrors; leave everything else
  // to the INTERNAL fallback so we don't expose raw Error.message strings to users.
  const isApiError =
    error !== null &&
    typeof error === 'object' &&
    'error' in error &&
    'message' in error;

  if (isApiError) {
    const apiError: ApiError = mapApiError(error);
    if (apiError.message) {
      useUIStore.getState().showToast(apiError.message, 'error');
      return;
    }
    const messageKey = getErrorMessageKey(apiError.error ?? 'INTERNAL');
    useUIStore.getState().showToast(t(messageKey, messageKey), 'error');
    return;
  }

  const messageKey = getErrorMessageKey('INTERNAL');
  useUIStore.getState().showToast(t(messageKey, messageKey), 'error');
};

/**
 * Main content component that requires QueryClient and Theme contexts.
 */
function AppContent({ isReady }: { isReady: boolean }) {
  const { activeScheme, colors } = useTheme();
  const token = useAuthStore((state) => state.token);
  const isDark = activeScheme === 'dark';

  usePushNotifications();
  useLocationHeartbeat();

  const navigationTheme = React.useMemo(
    () => ({
      dark: isDark,
      colors: {
        ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
        primary: colors.PRIMARY,
        background: colors.BACKGROUND,
        card: colors.SURFACE || colors.BACKGROUND,
        text: colors.TEXT,
        border: colors.BORDER || colors.GRAY,
        notification: colors.ERROR,
      },
      fonts: isDark ? DarkTheme.fonts : DefaultTheme.fonts,
    }),
    [isDark, colors],
  );

  if (!isReady) {
    return null;
  }

  return (
    <View style={styles.flex}>
      <NavigationContainer theme={navigationTheme} ref={navigationRef}>
        <RootNavigator key={token ?? 'unauthenticated'} />
      </NavigationContainer>
      <Toast />
      <AlertDialog />
      <ReportBottomSheet />
    </View>
  );
}

/**
 * Themed wrapper that handles providers - must be inside QueryClientProvider.
 */
function AppProviders() {
  const isReady = useAppBootstrap();

  return (
    <GestureHandlerRootView style={styles.flex}>
      <BottomSheetModalProvider>
        <SafeAreaProvider style={styles.flex}>
          <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
            <AppContent isReady={isReady} />
          </KeyboardProvider>
        </SafeAreaProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

export function App() {
  const { t } = useTranslation();

  React.useEffect(() => {
    queryClient.getQueryCache().config.onError = (error) =>
      handleGlobalError(error, t);
    queryClient.getMutationCache().config.onError = (error) =>
      handleGlobalError(error, t);
  }, [t]);

  return (
    <QueryClientProvider client={queryClient}>
      <AppProviders />
    </QueryClientProvider>
  );
}
