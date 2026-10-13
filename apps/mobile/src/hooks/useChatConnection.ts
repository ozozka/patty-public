import { useEffect } from 'react';
import { getChatService } from 'src/service/ChatService';
import { useAuthStore } from 'src/store/useAuthStore';

/**
 * Manages WebSocket connection lifecycle based on auth state.
 * Mount once at the app root. Connects when authenticated, disconnects otherwise.
 */
export function useChatConnection(): void {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (isAuthenticated && token) {
      getChatService().connect(token);
    } else {
      getChatService().disconnect();
    }
    return () => {
      getChatService().disconnect();
    };
  }, [isAuthenticated, token]);
}
