/**
 * Hook to track user's location and send heartbeats to the backend.
 * Updates only when the user moves by more than MIN_DISTANCE_METERS.
 */
import * as Location from 'expo-location';
import { useEffect } from 'react';
import { UserService } from 'src/service/UserService';
import { useAuthStore } from 'src/store/useAuthStore';
import { logger } from 'src/utils/logger';

const MIN_DISTANCE_METERS = 50;

export function useLocationHeartbeat() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    let subscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          logger.info('Location permission denied for heartbeat');
          return;
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: MIN_DISTANCE_METERS,
          },
          (location) => {
            const { latitude, longitude } = location.coords;
            void UserService.updateLocation(latitude, longitude).catch((e) =>
              logger.error('Failed to update heartbeat location', { error: e }),
            );
          },
        );
      } catch (error) {
        logger.error('Error starting location tracking', { error });
      }
    };

    void startTracking();

    return () => {
      subscription?.remove();
    };
  }, [isAuthenticated]);
}
