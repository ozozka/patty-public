import { z } from 'zod';

import { petSchema } from './pet';

export const accountStatusSchema = z.enum(['unverified', 'verified', 'banned']);
export const locationPrecisionSchema = z.enum(['exact', 'city']);

/** Only alphanumeric, underscores, and dots. */
const usernameRegex = /^[a-zA-Z0-9_.]+$/;

/** E.164-like phone format: optional + followed by 7-15 digits. */
const phoneRegex = /^\+?[1-9]\d{6,14}$/;

/** OTP code: exactly 6 digits. */
const otpCodeSchema = z.string().length(6).regex(/^\d{6}$/);

export const registerRequestSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(usernameRegex, 'Username can only contain letters, numbers, underscores, and dots')
    .transform((v) => v.trim()),
  email: z.string().email().max(256).transform((v) => v.trim().toLowerCase()),
  password: z.string().min(8).max(128),
  first_name: z.string().min(1).max(128).transform((v) => v.trim()),
  last_name: z.string().min(1).max(128).transform((v) => v.trim()),
  phone_number: z.string().regex(phoneRegex, 'Invalid phone number format').optional(),
  home_location_id: z.number().int().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  language: z.string().optional(),
  theme: z.string().optional(),
});

export const loginRequestSchema = z.object({
  identifier: z.string().min(1).transform((v) => v.trim()),
  password: z.string().min(1).max(128),
});

export const loginResponseSchema = z.object({
  token: z.string(),
  refresh_token: z.string(),
  status: accountStatusSchema,
});

// Register returns the same response as login (token + status + deleted_at)
export const registerResponseSchema = loginResponseSchema;

export const accountSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  bio: z.string().nullable().optional(),
  home_location_id: z.number().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  location_precision: locationPrecisionSchema,
  language: z.string(),
  theme: z.string(),
  profile_picture_url: z.string().nullable().optional(),
  push_token: z.string().nullable().optional(),
  status: accountStatusSchema,
  phone_number: z.string().nullable().optional(),
  phone_verified: z.boolean(),
  share_phone_with_matches: z.boolean(),
  is_online: z.boolean(),
  last_seen_at: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  deleted_at: z.string().nullable().optional(),
  created_at: z.string(),
});

// profileResponseSchema extends accountSchema with pets (populated by the account handler).
export const profileResponseSchema = accountSchema.extend({
  pets: z.array(petSchema),
});

export const publicProfileResponseSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  bio: z.string().nullable().optional(),
  profile_picture_url: z.string().nullable().optional(),
  phone_number: z.string().nullable().optional(),
  phone_verified: z.boolean(),
  home_location_id: z.number().nullable().optional(),
  distance_m: z.number().nullable().optional(),
  pets: z.array(petSchema),
  created_at: z.string(),
});

export const updateUserRequestSchema = z.object({
  email: z.string().email().max(256).optional(),
  first_name: z.string().min(1).max(128).optional(),
  last_name: z.string().min(1).max(128).optional(),
  bio: z.string().nullable().optional(),
  phone_number: z.string().regex(phoneRegex, 'Invalid phone number format').nullable().optional(),
  profile_picture_url: z.string().nullable().optional(),
  home_location_id: z.number().int().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  language: z.string().optional(),
  theme: z.string().optional(),
  share_phone_with_matches: z.boolean().optional(),
});

export const changePasswordRequestSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8).max(128),
});

export const verifyPasswordRequestSchema = z.object({
  password: z.string().min(1),
});

export const forgotPasswordRequestSchema = z.object({
  email: z.string().email().max(256),
});

export const resetPasswordRequestSchema = z.object({
  email: z.string().email().max(256),
  code: otpCodeSchema,
  new_password: z.string().min(8).max(128),
});

export const verifyResetOtpRequestSchema = z.object({
  email: z.string().email().max(256),
  code: otpCodeSchema,
});

export const emailVerifyPayloadSchema = z.object({
  code: otpCodeSchema,
});

export const phoneVerificationRequestSchema = z.object({
  phone_number: z.string().regex(phoneRegex, 'Invalid phone number format'),
});

export const phoneVerificationPayloadSchema = z.object({
  code: otpCodeSchema,
});

export const updatePushTokenRequestSchema = z.object({
  push_token: z.string().nullable(),
});

export const locationHeartbeatRequestSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const refreshTokenRequestSchema = z.object({
  refresh_token: z.string().min(1),
});

export const refreshTokenResponseSchema = z.object({
  token: z.string(),
  refresh_token: z.string(),
});

export const passwordVerifyResponseSchema = z.object({
  valid: z.boolean(),
});
