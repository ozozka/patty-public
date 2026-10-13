import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { AuthService } from 'src/service/AuthService';
import { useAuthStore } from 'src/store/useAuthStore';
import { logger } from 'src/utils/logger';
import { navigate } from 'src/utils/navigation';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    void registerForPushNotificationsAsync().then((token) => {
      if (token && isMounted) {
        AuthService.registerPushToken(token).catch((err) => {
          logger.error('Failed to register push token with backend', {
            error: err,
          });
        });
      }
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        // Handle foreground notification
        logger.info('Notification received in foreground', { notification });
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        // Handle notification tap
        logger.info('Notification response received', { response });
        const data = response.notification.request.content.data;

        if (data.type === 'MESSAGE' && typeof data.match_id === 'string') {
          navigate('ChatDetail', { conversationId: data.match_id });
        } else if (data.type === 'MATCH') {
          navigate('MainTabs', { screen: 'ChatListScreen' });
        }
      });

    return () => {
      isMounted = false;
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated]);
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') return null;

  if (!Device.isDevice) {
    logger.warn('Must use physical device for Push Notifications');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    logger.warn('Failed to get push token for push notification!');
    return null;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId ??
    '';

  if (!projectId) {
    logger.warn(
      'No EAS Project ID found. Push notifications may fail in production/preview builds.',
    );
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId }))
      .data;
    return token;
  } catch (e) {
    logger.error('Error fetching push token', { error: e });
    return null;
  }
}
