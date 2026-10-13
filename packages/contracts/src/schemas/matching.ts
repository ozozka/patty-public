import { z } from 'zod';

import { petCandidateSchema } from './pet';
import { messageTypeSchema } from './chat';

export const swipeActionSchema = z.enum(['LIKE', 'DISLIKE']);

export const swipeRequestSchema = z.object({
  active_pet_id: z.string().uuid(),
  target_pet_id: z.string().uuid(),
  action: swipeActionSchema,
});

export const swipeResultSchema = z.object({
  match_id: z.string().uuid().nullable(),
  is_match: z.boolean(),
});

export const getCandidatesParamsSchema = z.object({
  active_pet_id: z.string().uuid(),
  radius_km: z.coerce.number().optional(),
  limit: z.coerce.number().int().optional(),
});

export const matchPreferencesSchema = z.object({
  radius_km: z.number().optional(),
});

export const candidatesResponseSchema = z.object({
  candidates: z.array(petCandidateSchema),
});

export const matchSchema = z.object({
  id: z.string().uuid(),
  // Note: API returns denormalized format with other_user, not normalized user_one_id/user_two_id
  other_user: z.object({
    id: z.string().uuid(),
    username: z.string(),
    email: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    bio: z.string().nullable(),
    home_location_id: z.number().nullable(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    language: z.string(),
    theme: z.string(),
    profile_picture_url: z.string().nullable(),
    phone_number: z.string().nullable(),
    phone_verified: z.boolean(),
    share_phone_with_matches: z.boolean(),
    is_online: z.boolean(),
    last_seen_at: z.string().datetime().nullable(),
    status: z.enum(['unverified', 'verified', 'banned']),
    location_precision: z.enum(['exact', 'city']),
    created_at: z.string().datetime(),
  }),
  last_message: z.object({
    id: z.string().uuid(),
    match_id: z.string().uuid(),
    sender_id: z.string().uuid().nullable(),
    content: z.string().nullable(),
    message_type: messageTypeSchema,
    is_read: z.boolean(),
    created_at: z.string().datetime().nullable(),
    reply_to_id: z.string().uuid().nullable(),
  }).nullable(),
  unread_count: z.number().int(),
  is_online: z.boolean(),
  created_at: z.string().datetime(),
  last_message_id: z.string().uuid().nullable().optional(),
  last_message_sender_id: z.string().uuid().nullable().optional(),
  last_message_type: messageTypeSchema.nullable().optional(),
  last_message_preview: z.string().nullable().optional(),
  last_message_at: z.string().datetime().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
