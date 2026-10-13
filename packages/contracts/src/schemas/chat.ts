import { z } from 'zod';

export const messageTypeSchema = z.enum(['text', 'image', 'location']);

export const repliedMessageSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  sender_id: z.string().uuid(),
  message_type: messageTypeSchema,
});

export const messageSchema = z.object({
  id: z.string().uuid(),
  match_id: z.string().uuid(),
  sender_id: z.string().uuid(),
  content: z.string(),
  message_type: messageTypeSchema,
  is_read: z.boolean(),
  reply_to_id: z.string().uuid().nullable().optional(),
  replied_message: repliedMessageSchema.nullable().optional(),
  latitude: z.string().nullable().optional(),
  longitude: z.string().nullable().optional(),
  location_name: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  created_at: z.union([z.string(), z.date()]),
});

export const messageSendSchema = z.object({
  match_id: z.string().uuid(),
  content: z.string(),
  message_type: messageTypeSchema,
  reply_to_id: z.string().uuid().nullable().optional(),
  latitude: z.union([z.number(), z.string()]).optional(),
  longitude: z.union([z.number(), z.string()]).optional(),
});

export const getMessagesParamsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.union([z.number().int(), z.string()]).optional(),
});

export const messagesResponseSchema = z.object({
  messages: z.array(messageSchema),
  cursor: z.string().nullable(),
  has_more: z.boolean(),
});

export const markReadRequestSchema = z.object({
  last_read_message_id: z.string().uuid(),
});

export const unreadCountSchema = z.object({
  unread_count: z.number().int(),
});
