import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Nunito_300Light,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { useQueryClient } from '@tanstack/react-query';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { i18n } from 'src/i18n';
import { QueryKeys } from 'src/lib/queryKeys';
import { getChatService } from 'src/service/ChatService';
import { LocationService } from 'src/service/LocationService';
import { PetService } from 'src/service/PetService';
import { UserService } from 'src/service/UserService';
import { useAuthStore } from 'src/store/useAuthStore';
import { useChatStore } from 'src/store/useChatStore';
import { useMatchingStore } from 'src/store/useMatchingStore';
import { useUIStore } from 'src/store/useUIStore';
import { logger } from 'src/utils/logger';
import { tokenManager } from 'src/utils/tokenManager';

// Keep the splash screen visible while we fetch resources
void SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might cause some errors here, we can safely ignore them */
});

/**
 * Perform initial data loading tasks.
 */
export const useAppBootstrap = () => {
  const queryClient = useQueryClient();
  const [isReady, setIsReady] = useState(false);
  const initializeMatching = useMatchingStore((state) => state.initialize);
  const authenticate = useAuthStore((state) => state.authenticate);
  const deauthenticate = useAuthStore((state) => state.deauthenticate);
  const setLoading = useAuthStore((state) => state.setLoading);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const setOnlineStatus = useChatStore((s) => s.setOnlineStatus);
  const setTypingStatus = useChatStore((s) => s.setTypingStatus);
  const updateReadStatus = useChatStore((s) => s.updateReadStatus);
  const addMatch = useChatStore((s) => s.addMatch);
  const clearChat = useChatStore((s) => s.clearChat);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const bootstrap = async () => {
      try {
        // 1. Load Fonts (critical)
        await Font.loadAsync({
          Nunito_300Light,
          Nunito_400Regular,
          Nunito_600SemiBold,
          Nunito_700Bold,
          Inter_300Light,
          Inter_400Regular,
          Inter_500Medium,
          Inter_600SemiBold,
          Inter_700Bold,
        });

        // 2. Validate stored tokens (reads Zustand state hydrated from SecureStore)
        const { token: storedToken, refreshToken } = useAuthStore.getState();
        const token = tokenManager.isValid(storedToken) ? storedToken : null;
        const validRefresh = tokenManager.isValid(refreshToken)
          ? refreshToken
          : null;

        if (!token || !validRefresh) {
          if (storedToken || refreshToken) {
            // Had tokens but they're expired — inform the user
            useUIStore
              .getState()
              .showToast(i18n.t('error.auth.session_expired'), 'error');
            deauthenticate();
          }
          setLoading(false);
          return;
        }

        // 3. Fetch profile to verify token validity
        try {
          const profile = await UserService.getProfile();

          // Sync preferences
          if (profile.language) {
            void i18n.changeLanguage(profile.language);
          }

          // Seed cache before splash hides
          queryClient.setQueryData(QueryKeys.profile(), profile);

          // Authenticate (sets token, connects WebSocket)
          authenticate(token, refreshToken ?? '');

          // 4. Setup WebSocket subscriptions
          unsubscribe = getChatService().subscribe((chatEvent) => {
            if (chatEvent.type === 'RECONNECTED') {
              void queryClient.invalidateQueries({
                queryKey: QueryKeys.matches(),
              });
              return;
            }

            const event = chatEvent.event;
            switch (event.type) {
              case 'MessageReceive':
                appendMessage(event.payload.match_id, {
                  ...event.payload,
                  latitude: event.payload.latitude?.toString(),
                  longitude: event.payload.longitude?.toString(),
                });
                break;
              case 'PresenceUpdate':
                setOnlineStatus(event.payload.user_id, event.payload.online);
                break;
              case 'TypingStartRelay':
                setTypingStatus(
                  event.payload.match_id,
                  event.payload.user_id,
                  true,
                );
                break;
              case 'TypingStopRelay':
                setTypingStatus(
                  event.payload.match_id,
                  event.payload.user_id,
                  false,
                );
                break;
              case 'ReadReceiptRelay':
                updateReadStatus(
                  event.payload.match_id,
                  event.payload.last_read_message_id,
                  true,
                );
                break;
              case 'MatchCreated':
                addMatch(event.payload.match_id);
                break;
              case 'MatchDeleted':
                clearChat(event.payload.match_id);
                void queryClient.invalidateQueries({
                  queryKey: QueryKeys.matches(),
                });
                break;
              case 'TypingStart':
              case 'TypingStop':
              case 'ReadReceipt':
              case 'MessageSend':
              case 'Error':
                break;
            }
          });

          // 5. Initialize matching state
          await initializeMatching();

          // 6. Prefetch static data (non-blocking)
          void Promise.all([
            PetService.getPetTypes(),
            LocationService.getLocations(),
          ]).then(([petTypes, locations]) => {
            queryClient.setQueryData(QueryKeys.petTypes(), petTypes);
            queryClient.setQueryData(QueryKeys.locations(), locations);
          });
        } catch (error) {
          logger.error('Bootstrap validation failed', { error });
          useUIStore
            .getState()
            .showToast(i18n.t('error.auth.session_expired'), 'error');
          deauthenticate();
        }
      } catch (e) {
        logger.error('Bootstrap failed', { error: e });
        useUIStore
          .getState()
          .showToast(i18n.t('error.network.connection_failed'), 'error');
        setLoading(false);
      } finally {
        setIsReady(true);
        void SplashScreen.hideAsync().catch(() => {});
      }
    };

    void bootstrap();

    return () => {
      if (unsubscribe) unsubscribe();
      getChatService().disconnect();
    };
  }, [
    initializeMatching,
    appendMessage,
    setOnlineStatus,
    setTypingStatus,
    updateReadStatus,
    addMatch,
    clearChat,
    queryClient,
    authenticate,
    deauthenticate,
    setLoading,
  ]);

  return isReady;
};
