import { createNavigationContainerRef } from '@react-navigation/native';
import type { MainStackParamList } from 'src/types/navigation';

export const navigationRef = createNavigationContainerRef<MainStackParamList>();

export function navigate<RouteName extends keyof MainStackParamList>(
  name: RouteName,
  params: MainStackParamList[RouteName],
) {
  if (navigationRef.isReady()) {
    // Use dispatch to bypass React Navigation's complex overloaded navigate signature
    // while maintaining full type safety at the call site.
    navigationRef.dispatch({ type: 'NAVIGATE', payload: { name, params } });
  }
}
