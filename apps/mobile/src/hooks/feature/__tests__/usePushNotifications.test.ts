import { renderHook, waitFor } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { AuthService } from 'src/service/AuthService';
import type { AuthState } from 'src/store/useAuthStore';
import { useAuthStore } from 'src/store/useAuthStore';
import { navigate } from 'src/utils/navigation';

import { usePushNotifications } from '../usePushNotifications';

jest.mock('src/service/AuthService');
jest.mock('src/utils/navigation');
jest.mock('src/store/useAuthStore', () => ({
  useAuthStore: jest.fn(),
}));

const mockUseAuthStore = jest.mocked(useAuthStore);

const createMockAuthState = (overrides: Partial<AuthState> = {}): AuthState =>
  ({
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    theme: 'system',
    language: 'tr',
    authenticate: jest.fn(),
    updateTokens: jest.fn(),
    deauthenticate: jest.fn(),
    setLoading: jest.fn(),
    setTheme: jest.fn(),
    setLanguage: jest.fn(),
    ...overrides,
  }) satisfies AuthState;

describe('usePushNotifications', () => {
  beforeEach(() => {
    mockUseAuthStore.mockImplementation((selector) =>
      selector(createMockAuthState({ isAuthenticated: true })),
    );
  });

  it('should register push token on mount when authenticated', async () => {
    jest
      .mocked(Notifications.getExpoPushTokenAsync)
      .mockResolvedValue({ data: 'fake-token' } as Awaited<
        ReturnType<typeof Notifications.getExpoPushTokenAsync>
      >);
    jest.mocked(AuthService.registerPushToken).mockResolvedValue(undefined);

    renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalled();
      expect(AuthService.registerPushToken).toHaveBeenCalledWith('fake-token');
    });
  });

  it('should not register push token when not authenticated', async () => {
    mockUseAuthStore.mockImplementation((selector) =>
      selector(createMockAuthState({ isAuthenticated: false })),
    );
    jest
      .mocked(Notifications.getExpoPushTokenAsync)
      .mockResolvedValue({ data: 'fake-token' } as Awaited<
        ReturnType<typeof Notifications.getExpoPushTokenAsync>
      >);

    renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    });
  });

  it('should handle notification received in foreground', async () => {
    let listener: (n: unknown) => void = () => {};
    jest
      .mocked(Notifications.addNotificationReceivedListener)
      .mockImplementation((cb) => {
        listener = cb as unknown as (n: unknown) => void;
        return { remove: jest.fn() } as ReturnType<
          typeof Notifications.addNotificationReceivedListener
        >;
      });

    renderHook(() => usePushNotifications());

    const mockNotification = { request: { content: { data: {} } } };
    listener(mockNotification);

    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Success,
    );
  });

  it('should navigate to ChatDetail on MESSAGE notification tap', async () => {
    let responseListener: (r: unknown) => void = () => {};
    jest
      .mocked(Notifications.addNotificationResponseReceivedListener)
      .mockImplementation((cb) => {
        responseListener = cb as unknown as (r: unknown) => void;
        return { remove: jest.fn() } as ReturnType<
          typeof Notifications.addNotificationResponseReceivedListener
        >;
      });

    renderHook(() => usePushNotifications());

    const mockResponse = {
      notification: {
        request: {
          content: {
            data: { type: 'MESSAGE', match_id: 'match-123' },
          },
        },
      },
    };

    responseListener(mockResponse);

    expect(navigate).toHaveBeenCalledWith('ChatDetail', {
      conversationId: 'match-123',
    });
  });

  it('should navigate to ChatList on MATCH notification tap', async () => {
    let responseListener: (r: unknown) => void = () => {};
    jest
      .mocked(Notifications.addNotificationResponseReceivedListener)
      .mockImplementation((cb) => {
        responseListener = cb as unknown as (r: unknown) => void;
        return { remove: jest.fn() } as ReturnType<
          typeof Notifications.addNotificationResponseReceivedListener
        >;
      });

    renderHook(() => usePushNotifications());

    const mockResponse = {
      notification: {
        request: {
          content: {
            data: { type: 'MATCH' },
          },
        },
      },
    };

    responseListener(mockResponse);

    expect(navigate).toHaveBeenCalledWith('MainTabs', {
      screen: 'ChatListScreen',
    });
  });
});
