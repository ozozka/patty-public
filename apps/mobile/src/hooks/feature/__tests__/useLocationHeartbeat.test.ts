import { renderHook, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { UserService } from 'src/service/UserService';
import type { AuthState } from 'src/store/useAuthStore';
import { useAuthStore } from 'src/store/useAuthStore';

import { useLocationHeartbeat } from '../useLocationHeartbeat';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
  Accuracy: {
    Balanced: 3,
  },
}));
jest.mock('src/service/UserService');
jest.mock('src/store/useAuthStore');

describe('useLocationHeartbeat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(useAuthStore)
      .mockImplementation((selector) =>
        selector({ isAuthenticated: true } as unknown as AuthState),
      );
    jest
      .mocked(Location.requestForegroundPermissionsAsync)
      .mockResolvedValue({ status: 'granted' } as Awaited<
        ReturnType<typeof Location.requestForegroundPermissionsAsync>
      >);
  });

  it('starts tracking location when authenticated', async () => {
    const mockWatchPosition = jest.fn();
    jest
      .mocked(Location.watchPositionAsync)
      .mockImplementation((_options, callback) => {
        mockWatchPosition();
        callback({
          coords: { latitude: 41.0, longitude: 28.0 },
          timestamp: Date.now(),
        } as Location.LocationObject);
        return Promise.resolve({
          remove: jest.fn(),
        } as Location.LocationSubscription);
      });

    renderHook(() => useLocationHeartbeat());

    await waitFor(() => {
      expect(Location.watchPositionAsync).toHaveBeenCalled();
      expect(UserService.updateLocation).toHaveBeenCalledWith(41.0, 28.0);
    });
  });

  it('does not track when not authenticated', async () => {
    jest
      .mocked(useAuthStore)
      .mockImplementation((selector) =>
        selector({ isAuthenticated: false } as unknown as AuthState),
      );

    renderHook(() => useLocationHeartbeat());

    expect(Location.watchPositionAsync).not.toHaveBeenCalled();
  });
});
