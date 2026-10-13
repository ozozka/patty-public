import { z } from "zod";

import { sendPushNotificationToUser } from "../features/notification/service";
import { publish, subscribe } from "./pubsub";

export interface AppEventMap {
  "match.created": { matchId: string; userOneId: string; userTwoId: string };
  "message.sent": {
    matchId: string;
    senderId: string;
    recipientId: string;
    messageId: string;
  };
}

// Zod schemas for each event — used to validate payloads received via Redis pub/sub.
// The `satisfies` constraint proves each schema output matches AppEventMap[K].
const appEventSchemas = {
  "match.created": z.object({
    matchId: z.string(),
    userOneId: z.string(),
    userTwoId: z.string(),
  }),
  "message.sent": z.object({
    matchId: z.string(),
    senderId: z.string(),
    recipientId: z.string(),
    messageId: z.string(),
  }),
} satisfies { [K in keyof AppEventMap]: z.ZodType<AppEventMap[K]> };

// Channel name prefix to avoid Redis key collisions.
const CHANNEL_PREFIX = "patty_";

function toChannel(event: string): string {
  return `${CHANNEL_PREFIX}${event.replace(".", "_")}`;
}

/**
 * Application-wide event bus backed by Redis pub/sub.
 * Supports multi-instance deployments — events from any instance reach all instances.
 */
export const eventBus = {
  emit<K extends keyof AppEventMap>(event: K, data: AppEventMap[K]): void {
    void publish(toChannel(event), data);
  },

  onMatchCreated(listener: (data: AppEventMap["match.created"]) => void): void {
    void subscribe(toChannel("match.created"), (payload) => {
      listener(appEventSchemas["match.created"].parse(payload));
    });
  },

  onMessageSent(listener: (data: AppEventMap["message.sent"]) => void): void {
    void subscribe(toChannel("message.sent"), (payload) => {
      listener(appEventSchemas["message.sent"].parse(payload));
    });
  },
};

export function registerEventListeners() {
  eventBus.onMatchCreated((data) => {
    void sendPushNotificationToUser(data.userOneId, "MATCH_CREATED", {
      match_id: data.matchId,
    });
    void sendPushNotificationToUser(data.userTwoId, "MATCH_CREATED", {
      match_id: data.matchId,
    });
  });

  eventBus.onMessageSent((data) => {
    void sendPushNotificationToUser(data.recipientId, "NEW_MESSAGE", {
      match_id: data.matchId,
      message_id: data.messageId,
    });
  });
}
