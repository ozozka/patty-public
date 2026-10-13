import type { Match, Message, WsEvent } from '@patty/contracts';
import { matchSchema, messageSchema, wsEventSchema } from '@patty/contracts';
import type { AppStateStatus } from 'react-native';
import { AppState } from 'react-native';
import { apiClient } from 'src/api/client';
import { Config } from 'src/Config';
import { logger } from 'src/utils/logger';
import { z } from 'zod';

import { BaseService } from './BaseService';

export interface GetMessagesParams {
  limit?: number;
  cursor?: string;
}

export type ChatEvent =
  | { type: 'RECONNECTED' }
  | { type: 'EVENT'; event: WsEvent };

type EventHandler = (event: ChatEvent) => void;

export class ChatService extends BaseService {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private handlers: Set<EventHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = Config.websocket.maxReconnectAttempts;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private appStateSubscription: { remove: () => void } | null = null;

  constructor() {
    super();
    this.setupAppStateListener();
  }

  private setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          logger.info('App became active, checking connection...');
          if (
            this.token &&
            (!this.ws || this.ws.readyState !== WebSocket.OPEN)
          ) {
            this.connect(this.token);
          }
        }
      },
    );
  }

  /**
   * Get all matches (conversations) for the current user.
   */
  static async getConversations(): Promise<Match[]> {
    const response = await apiClient.api.v1.matches.$get();
    return this.handle(response, z.array(matchSchema));
  }

  /**
   * Get messages for a specific match.
   */
  static async getMessages(
    matchId: string,
    params: GetMessagesParams = {},
  ): Promise<Message[]> {
    const response = await apiClient.api.v1.matches[':match_id'].messages.$get({
      param: { match_id: matchId },
      query: {
        limit: params.limit,
        cursor: params.cursor,
      },
    });
    return this.handle(response, z.array(messageSchema));
  }

  /**
   * Send a message via REST.
   */
  static async sendMessage(matchId: string, content: string): Promise<Message> {
    const response = await apiClient.api.v1.matches[':match_id'].messages.$post(
      {
        param: { match_id: matchId },
        json: {
          match_id: matchId,
          content,
          message_type: 'text',
        },
      },
    );
    return this.handle(response, messageSchema);
  }

  /**
   * Mark messages as read.
   */
  static async markRead(
    matchId: string,
    lastReadMessageId: string,
  ): Promise<void> {
    const response = await apiClient.api.v1.matches[
      ':match_id'
    ].messages.read.$post({
      param: { match_id: matchId },
      json: { last_read_message_id: lastReadMessageId },
    });
    return this.handle(response);
  }

  /**
   * Unmatch with a user.
   */
  static async unmatch(matchId: string): Promise<void> {
    const response = await apiClient.api.v1.matches[':match_id'].$delete({
      param: { match_id: matchId },
    });
    return this.handle(response);
  }

  // --- WebSocket Methods ---

  connect(token: string) {
    this.token = token;
    const wsUrl = Config.api.BASE_URL.replace('http', 'ws') + 'ws';

    // Pass token in Sec-WebSocket-Protocol as common workaround for custom headers
    this.ws = new WebSocket(wsUrl, [token]);

    this.ws.onopen = () => {
      logger.info('WebSocket connected');
      this.reconnectAttempts = 0;
      this.handlers.forEach((handler) => handler({ type: 'RECONNECTED' }));
    };

    this.ws.onmessage = (event) => {
      try {
        const parsed = wsEventSchema.safeParse(JSON.parse(event.data));
        if (!parsed.success) {
          logger.error('Invalid WebSocket event', {
            error: parsed.error,
            raw: event.data,
          });
          return;
        }
        this.handlers.forEach((handler) =>
          handler({ type: 'EVENT', event: parsed.data }),
        );
      } catch (e) {
        logger.error('Failed to parse message', { error: e });
      }
    };

    this.ws.onclose = (e) => {
      logger.info('WebSocket closed', { code: e.code, reason: e.reason });
      this.handleReconnect();
    };

    this.ws.onerror = (e) => {
      logger.error('WebSocket error', { error: e });
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  destroy() {
    this.disconnect();
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    this.handlers.clear();
  }

  sendEvent(event: WsEvent) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    } else {
      logger.warn('Cannot send, WebSocket not open');
    }
  }

  subscribe(handler: EventHandler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      logger.info(`Reconnecting in ${delay}ms...`);

      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
      }

      this.reconnectTimer = setTimeout(() => {
        this.reconnectAttempts++;
        if (this.token) {
          this.connect(this.token);
        }
      }, delay);
      if (this.reconnectTimer.unref) this.reconnectTimer.unref();
    }
  }
}

// Lazy initialization getter for singleton instance
let chatServiceInstance: ChatService | null = null;

export const getChatService = (): ChatService => {
  chatServiceInstance ??= new ChatService();
  return chatServiceInstance;
};

// Backward-compatible singleton export - uses same lazy instance
export const chatService = {
  get instance() {
    return getChatService();
  },
  connect(token: string) {
    return getChatService().connect(token);
  },
  disconnect() {
    return getChatService().disconnect();
  },
  destroy() {
    return getChatService().destroy();
  },
  sendEvent(event: WsEvent) {
    return getChatService().sendEvent(event);
  },
  subscribe(handler: EventHandler) {
    return getChatService().subscribe(handler);
  },
};
