import { z } from 'zod';

export const reportReasonSchema = z.enum([
  'spam',
  'inappropriate',
  'harassment',
  'fraud',
  'other',
]);

export const reportStatusSchema = z.enum([
  'pending',
  'reviewed',
  'resolved',
  'dismissed',
]);

export const reportTargetTypeSchema = z.enum(['account', 'pet', 'message']);

export const createReportRequestSchema = z.object({
  target_type: reportTargetTypeSchema,
  reason: reportReasonSchema,
  target_account_id: z.string().uuid().optional(),
  target_pet_id: z.string().uuid().optional(),
  target_message_id: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const blockUserRequestSchema = z.object({
  blocked_id: z.string().uuid(),
});

export const userBlockSchema = z.object({
  blocker_id: z.string().uuid(),
  blocked_id: z.string().uuid(),
  created_at: z.string(),
});

export const reportSchema = z.object({
  id: z.string().uuid(),
  reporter_id: z.string().uuid(),
  target_type: reportTargetTypeSchema,
  target_account_id: z.string().uuid().nullable().optional(),
  target_pet_id: z.string().uuid().nullable().optional(),
  target_message_id: z.string().uuid().nullable().optional(),
  reason: reportReasonSchema,
  status: reportStatusSchema,
  metadata: z.record(z.string(), z.unknown()),
  created_at: z.string(),
  resolved_at: z.string().nullable().optional(),
});

export const blockedUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  profile_picture_url: z.string().nullable(),
});

export const createReportResponseSchema = z.object({
  id: z.string().uuid(),
});
