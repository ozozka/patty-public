/** Source file for RootNavigator. */
import * as React from 'react';
import { LandingScreen } from 'src/screens/LandingScreen';
import { useAuthStore } from 'src/store/useAuthStore';

import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';

/**
 * Top-level navigator that switches between auth and app stacks.
 */
export function RootNavigator() {
  const { isLoading, token } = useAuthStore();

  if (isLoading) return <LandingScreen />;
  if (!token) return <AuthNavigator />;

  return <AppNavigator />;
}
