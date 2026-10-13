import { z } from 'zod';

import { messageTypeSchema, messageSendSchema } from './chat';

// Client → Server events
export const wsTypingStartSchema = z.object({
  type: z.literal('TypingStart'),
  payload: z.object({
    match_id: z.string().uuid(),
  }),
});

export const wsTypingStopSchema = z.object({
  type: z.literal('TypingStop'),
  payload: z.object({
    match_id: z.string().uuid(),
  }),
});

export const wsReadReceiptSchema = z.object({
  type: z.literal('ReadReceipt'),
  payload: z.object({
    match_id: z.string().uuid(),
    last_read_message_id: z.string().uuid(),
  }),
});

export const wsMessageSendSchema = z.object({
  type: z.literal('MessageSend'),
  payload: messageSendSchema,
});

// Server → Client events (also used as outbound from server)
export const wsPresenceUpdateSchema = z.object({
  type: z.literal('PresenceUpdate'),
  payload: z.object({
    user_id: z.string().uuid(),
    online: z.boolean(),
  }),
});

export const wsMessageReceiveSchema = z.object({
  type: z.literal('MessageReceive'),
  payload: z.object({
    id: z.string().uuid(),
    match_id: z.string().uuid(),
    sender_id: z.string().uuid(),
    content: z.string(),
    message_type: messageTypeSchema,
    is_read: z.boolean(),
    reply_to_id: z.string().uuid().nullable().optional(),
    replied_message: z
      .object({
        id: z.string().uuid(),
        content: z.string(),
        sender_id: z.string().uuid(),
        message_type: messageTypeSchema,
      })
      .nullable()
      .optional(),
    latitude: z.union([z.string(), z.number()]).nullable().optional(),
    longitude: z.union([z.string(), z.number()]).nullable().optional(),
    location_name: z.string().nullable().optional(),
    metadata: z.record(z.string(), z.unknown()),
    created_at: z.string(),
  }),
});

export const wsReadReceiptRelaySchema = z.object({
  type: z.literal('ReadReceiptRelay'),
  payload: z.object({
    match_id: z.string().uuid(),
    user_id: z.string().uuid(),
    last_read_message_id: z.string().uuid(),
  }),
});

export const wsTypingStartRelaySchema = z.object({
  type: z.literal('TypingStartRelay'),
  payload: z.object({
    match_id: z.string().uuid(),
    user_id: z.string().uuid(),
  }),
});

export const wsTypingStopRelaySchema = z.object({
  type: z.literal('TypingStopRelay'),
  payload: z.object({
    match_id: z.string().uuid(),
    user_id: z.string().uuid(),
  }),
});

export const wsMatchCreatedSchema = z.object({
  type: z.literal('MatchCreated'),
  payload: z.object({
    match_id: z.string().uuid(),
    other_user_id: z.string().uuid(),
  }),
});

export const wsMatchDeletedSchema = z.object({
  type: z.literal('MatchDeleted'),
  payload: z.object({
    match_id: z.string().uuid(),
  }),
});

export const wsErrorSchema = z.object({
  type: z.literal('Error'),
  payload: z.string(),
});

/** All WebSocket events (both directions) as a discriminated union on `type`. */
export const wsEventSchema = z.discriminatedUnion('type', [
  wsTypingStartSchema,
  wsTypingStopSchema,
  wsReadReceiptSchema,
  wsMessageSendSchema,
  wsPresenceUpdateSchema,
  wsMessageReceiveSchema,
  wsReadReceiptRelaySchema,
  wsTypingStartRelaySchema,
  wsTypingStopRelaySchema,
  wsMatchCreatedSchema,
  wsMatchDeletedSchema,
  wsErrorSchema,
]);
