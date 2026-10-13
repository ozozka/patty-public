import { env } from "@patty/api/env";
import { AppError } from "@patty/api/lib/errors";
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from "@patty/api/lib/jwt";
import { logger } from "@patty/api/lib/logger";
import { constantTimeEq, generateOtp } from "@patty/api/lib/otp";
import { hashPassword, verifyPassword } from "@patty/api/lib/password";
import { getPresence } from "@patty/api/lib/presence";
import {
  checkLoginRateLimit,
  clearLoginRateLimit,
  LoginRateLimitError,
} from "@patty/api/lib/rate-limiter";
import type {
  registerRequestSchema,
  updateUserRequestSchema,
} from "@patty/contracts";
import { registerResponseSchema } from "@patty/contracts";
import { randomUUID } from "crypto";
import { addDays, format } from "date-fns";
import type { z } from "zod";

import { getAccountPets, type PetRow } from "../pet/repository";
import {
  sendAccountDeletionEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "./email";
import * as repo from "./repository";

// ---------------------------------------------------------------------------
// Config constants
// ---------------------------------------------------------------------------

const EMAIL_IP_THROTTLE_LIMIT = env.EMAIL_IP_THROTTLE_LIMIT;
const EMAIL_DAILY_CAP = env.EMAIL_DAILY_CAP;
const MAX_VERIFY_ATTEMPTS = 5;

// ---------------------------------------------------------------------------
// Inferred types from contract schemas (used only as type aliases)
// ---------------------------------------------------------------------------

type RegisterInput = z.infer<typeof registerRequestSchema>;
type UpdateUserInput = z.infer<typeof updateUserRequestSchema>;

// ---------------------------------------------------------------------------
// Formatters (data transformation logic)
// ---------------------------------------------------------------------------

/** Formats an AccountRow into the public API response shape. */
export function formatAccount(a: repo.AccountRow) {
  return {
    id: a.id,
    username: a.username,
    email: a.email,
    first_name: a.firstName,
    last_name: a.lastName,
    bio: a.bio,
    home_location_id: a.homeLocationId,
    latitude: a.latitude,
    longitude: a.longitude,
    language: a.language,
    theme: a.theme,
    profile_picture_url: a.profilePictureUrl,
    phone_number: a.phoneNumber,
    phone_verified: a.phoneVerified,
    share_phone_with_matches: a.sharePhoneWithMatches,
    is_online: a.isOnline,
    last_seen_at: a.lastSeenAt,
    status: a.status,
    pending_email: a.pendingEmail,
    location_precision: a.locationPrecision,
    created_at: a.createdAt,
  };
}

/** Formats a PetRow into the public API response shape. */
export function formatPet(p: PetRow) {
  return {
    id: p.id,
    account_id: p.accountId,
    name: p.name,
    breed_id: p.breedId,
    birth_date: p.birthDate,
    bio: p.bio,
    energy_level: p.energyLevel,
    gender: p.gender,
    matching_preferences: p.matchingPreferences,
    photos: p.photos.map((ph) => ({
      id: ph.id,
      pet_id: ph.petId,
      image_url: ph.imageUrl,
      display_order: ph.displayOrder,
      created_at: ph.createdAt,
    })),
    created_at: p.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/** Creates a new account, hashes the password, triggers email verification, and returns auth token. */
export async function register(
  data: RegisterInput,
  clientIp: string | null,
): Promise<z.infer<typeof registerResponseSchema>> {
  const hash = await hashPassword(data.password);
  const id = randomUUID();

  await repo.createAccount({
    id,
    username: data.username.toLowerCase(),
    email: data.email.toLowerCase(),
    firstName: data.first_name,
    lastName: data.last_name,
    password: hash,
    homeLocationId: data.home_location_id ?? null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    language: data.language ?? "tr",
    theme: data.theme ?? "system",
    phoneNumber: data.phone_number ?? null,
  });

  await requestEmailVerification(id, clientIp);

  // Return tokens directly so client doesn't need to login after registration
  const account = await repo.findById(id);
  const token = await signAccessToken(account.id, account.tokenVersion);
  const refreshToken = await signRefreshToken(account.id, account.tokenVersion);
  const result = {
    token,
    refresh_token: refreshToken,
    status: account.status,
  };
  return registerResponseSchema.parse(result);
}

/** Authenticates a user by identifier (username or email) and password. */
export async function login(
  identifier: string,
  password: string,
  clientIp: string | null,
): Promise<{
  token: string;
  refresh_token: string;
  status: string;
}> {
  const lower = identifier.toLowerCase();

  // Rate-limit by identifier and IP
  try {
    await checkLoginRateLimit(`id:${lower}`);
    if (clientIp) await checkLoginRateLimit(`ip:${clientIp}`);
  } catch (err) {
    if (err instanceof LoginRateLimitError) {
      throw AppError.rateLimited(err.message);
    }
    throw err;
  }

  let account = await repo.findByUsernameOrEmailOrNull(lower);
  if (!account) {
    const deleted = await repo.findDeletedByUsernameOrEmailOrNull(lower);
    if (!deleted) throw AppError.unauthorized("Invalid credentials");
    account = deleted;
  }

  const valid = await verifyPassword(password, account.password);
  if (!valid) throw AppError.unauthorized("Invalid credentials");

  // Clear rate limit on successful login
  await clearLoginRateLimit(`id:${lower}`);
  if (clientIp) await clearLoginRateLimit(`ip:${clientIp}`);

  if (account.status === "banned")
    throw AppError.forbidden("Account is banned");

  const token = await signAccessToken(account.id, account.tokenVersion);
  const refreshToken = await signRefreshToken(account.id, account.tokenVersion);
  return {
    token,
    refresh_token: refreshToken,
    status: account.status,
  };
}

/** Validates that a session is still active (account exists and is not deleted). */
export async function validateSession(userId: string): Promise<void> {
  await repo.findById(userId);
}

/** Invalidates all existing tokens for the user by incrementing the token version. */
export async function logout(userId: string): Promise<void> {
  await repo.incrementTokenVersion(userId);
}

/** Refreshes a session using a valid refresh token. Returns new access + refresh tokens. */
export async function refreshSession(
  refreshTokenStr: string,
): Promise<{ token: string; refresh_token: string }> {
  const payload = await verifyToken(refreshTokenStr);
  if (!payload.sub) throw AppError.unauthorized("Invalid refresh token");
  if (payload.type !== "refresh")
    throw AppError.unauthorized("Invalid token type");

  const account = await repo.findByIdIncludingDeleted(payload.sub);
  if (account.deletedAt) throw AppError.unauthorized("Account is deleted");
  if (account.status === "banned")
    throw AppError.forbidden("Account is banned");

  // Check token version — if password changed, all old tokens are invalid
  if (payload.tv !== account.tokenVersion) {
    throw AppError.unauthorized("Token has been revoked");
  }

  const token = await signAccessToken(account.id, account.tokenVersion);
  const refreshToken = await signRefreshToken(account.id, account.tokenVersion);
  return { token, refresh_token: refreshToken };
}

/** Verifies an email address using the provided OTP code. */
export async function verifyEmail(userId: string, code: string): Promise<void> {
  const verification = await repo.getEmailVerificationCode(userId);
  if (!verification) throw AppError.validation("No verification code found");

  if (verification.verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
    await repo.deleteEmailVerificationCode(userId);
    throw AppError.rateLimited(
      "Too many failed attempts. Please request a new code.",
    );
  }

  if (verification.expiresAt < new Date())
    throw AppError.validation("Invalid or expired code");

  const account = await repo.findById(userId);

  // Maestro E2E Bypass - Expanded to support all @patty.app test emails
  const isDevelopment = env.NODE_ENV !== "production";
  const isTestEmail = account.email?.endsWith("@patty.app");
  const isBypassCode = code.trim() === env.E2E_BYPASS_CODE;

  if (isDevelopment && isTestEmail && isBypassCode) {
    // Valid bypass for any @patty.app test email in development
  } else if (!constantTimeEq(verification.code.trim(), code.trim())) {
    await repo.incrementEmailVerifyAttempts(userId);
    throw AppError.validation("Invalid verification code");
  }

  await repo.verifyEmail(userId);
}

// Shared shape for OTP send records (email verification and password reset).
type OtpSendRecord = {
  lastSentAt: Date;
  attempts: number;
  createdAt: Date;
  lastDailyResetAt: Date;
  dailyCount: number;
};

/**
 * Enforces rate-limit rules for any OTP send operation.
 * Throws AppError.rateLimited if any limit is exceeded.
 */
function checkOtpSendRateLimit(
  existing: OtpSendRecord | null,
  ipCount: number,
): void {
  if (existing) {
    const now = Date.now();

    if (now - existing.lastSentAt.getTime() < 60_000) {
      throw AppError.rateLimited(
        "Please wait 60 seconds before requesting a new code",
      );
    }

    if (
      existing.attempts >= 3 &&
      now - existing.createdAt.getTime() < 15 * 60_000
    ) {
      throw AppError.rateLimited(
        "Maximum attempts reached. Please try again later.",
      );
    }

    if (
      now - existing.lastDailyResetAt.getTime() < 24 * 3600_000 &&
      existing.dailyCount >= EMAIL_DAILY_CAP
    ) {
      throw AppError.rateLimited(
        "Daily limit reached. Please try again in 24 hours.",
      );
    }
  }

  if (ipCount >= EMAIL_IP_THROTTLE_LIMIT) {
    throw AppError.rateLimited(
      "Too many requests from this IP address. Please try again later.",
    );
  }
}

/** Sends a verification email with rate-limiting checks. */
export async function requestEmailVerification(
  userId: string,
  ip: string | null,
): Promise<void> {
  const existing = await repo.getEmailVerificationCode(userId);
  const ipCount = ip ? await repo.countEmailCodesByIp(ip) : 0;
  checkOtpSendRateLimit(existing, ipCount);

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 15 * 60_000);
  await repo.upsertEmailVerificationCode(userId, code, expiresAt, ip);

  const account = await repo.findById(userId);
  const targetEmail = account.pendingEmail ?? account.email;
  await sendVerificationEmail(targetEmail, code, account.language);
}

/** Sends a password reset email. Silently succeeds if the account is not found. */
export async function requestPasswordReset(
  email: string,
  ip: string | null,
): Promise<void> {
  let account: repo.AccountRow;
  try {
    account = await repo.findByUsernameOrEmail(email);
  } catch {
    // Prevent account harvesting by always returning success.
    return;
  }

  const existing = await repo.getPasswordResetCode(account.id);
  const ipCount = ip ? await repo.countPasswordResetCodesByIp(ip) : 0;
  checkOtpSendRateLimit(existing, ipCount);

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 15 * 60_000);
  await repo.upsertPasswordResetCode(account.id, code, expiresAt, ip);
  await sendPasswordResetEmail(account.email, code, account.language);
}

/**
 * Validates a password reset OTP without consuming it.
 * Prevents navigation to NewPasswordScreen for wrong codes.
 */
export async function verifyResetOtp(
  email: string,
  code: string,
): Promise<void> {
  const account = await repo.findByUsernameOrEmailOrNull(email.toLowerCase());
  // Return same error for unknown email to prevent account harvesting
  if (!account) throw AppError.validation("Invalid or expired code");

  const reset = await repo.getPasswordResetCode(account.id);
  if (!reset) throw AppError.validation("Invalid or expired code");

  if (reset.verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
    await repo.deletePasswordResetCode(account.id);
    throw AppError.rateLimited(
      "Too many failed attempts. Please request a new code.",
    );
  }

  if (reset.expiresAt < new Date())
    throw AppError.validation("Invalid or expired code");

  // Maestro E2E Bypass
  const isMaestro =
    env.NODE_ENV !== "production" && account.email === env.E2E_TEST_EMAIL;
  const isBypassCode = code.trim() === env.E2E_BYPASS_CODE;

  if (isMaestro && isBypassCode) {
    // Valid bypass
  } else if (!constantTimeEq(reset.code.trim(), code.trim())) {
    await repo.incrementPasswordResetVerifyAttempts(account.id);
    throw AppError.validation("Invalid or expired code");
  }
  // Code is valid — do not delete; final resetPassword will consume it
}

/** Resets a password using a verified OTP code. */
export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  const account = await repo.findByUsernameOrEmail(email.toLowerCase());

  const reset = await repo.getPasswordResetCode(account.id);
  if (!reset) throw AppError.validation("No reset code found");

  if (reset.verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
    await repo.deletePasswordResetCode(account.id);
    throw AppError.rateLimited(
      "Too many failed attempts. Please request a new code.",
    );
  }

  if (reset.expiresAt < new Date())
    throw AppError.validation("Reset code expired");

  // Maestro E2E Bypass
  const isMaestro =
    env.NODE_ENV !== "production" && account.email === env.E2E_TEST_EMAIL;
  const isBypassCode = code.trim() === env.E2E_BYPASS_CODE;

  if (isMaestro && isBypassCode) {
    // Valid bypass
  } else if (!constantTimeEq(reset.code.trim(), code.trim())) {
    await repo.incrementPasswordResetVerifyAttempts(account.id);
    throw AppError.validation("Invalid reset code");
  }

  const hash = await hashPassword(newPassword);
  await repo.updatePassword(account.id, hash);
  await repo.incrementTokenVersion(account.id);
  await repo.deletePasswordResetCode(account.id);
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

/** Returns the full profile (account + pets) for the authenticated user. */
export async function getProfile(userId: string) {
  const [account, pets, presence] = await Promise.all([
    repo.findById(userId),
    getAccountPets(userId),
    // Live presence from Redis. Falls back to { isOnline: false, lastSeenAt: null }
    // on Redis errors, in which case the DB snapshot values are used below.
    getPresence(userId),
  ]);

  return {
    ...formatAccount(account),
    // Override DB snapshot with Redis live state. If Redis is unavailable,
    // getPresence() returns isOnline: false / lastSeenAt: null and we fall back
    // to the DB columns (isOnline from last graceful disconnect, lastSeenAt timestamp).
    is_online: presence.isOnline || account.isOnline,
    last_seen_at: presence.lastSeenAt ?? account.lastSeenAt,
    pets: pets.map(formatPet),
  };
}

/** Returns a public profile for a target user, limiting phone exposure for non-self viewers. */
export async function getPublicProfile(viewerId: string, targetId: string) {
  const [account, pets] = await Promise.all([
    repo.findById(targetId),
    getAccountPets(targetId),
  ]);

  const phoneNumber = targetId === viewerId ? account.phoneNumber : null;

  return {
    id: account.id,
    username: account.username,
    first_name: account.firstName,
    last_name: account.lastName,
    bio: account.bio,
    home_location_id: account.homeLocationId,
    profile_picture_url: account.profilePictureUrl,
    phone_number: phoneNumber,
    phone_verified: account.phoneVerified,
    pets: pets.map(formatPet),
    created_at: account.createdAt,
    distance_m: null,
  };
}

/** Updates account fields, detecting phone number and email changes to reset/trigger verification. */
export async function updateUser(
  userId: string,
  data: UpdateUserInput,
  clientIp: string | null = null,
): Promise<void> {
  const hasCoords = data.latitude != null && data.longitude != null;

  const old = await repo.findById(userId);
  const phoneChanged =
    data.phone_number != null && data.phone_number !== old.phoneNumber;

  const emailChanged = data.email != null && data.email !== old.email;
  const pendingEmail = emailChanged ? data.email : null;

  await repo.updateAccount(userId, {
    firstName: data.first_name ?? null,
    lastName: data.last_name ?? null,
    // Do not update email immediately if it changed, it goes to pendingEmail
    email: emailChanged ? null : (data.email ?? null),
    bio: data.bio ?? null,
    homeLocationId: data.home_location_id ?? null,
    latitude: hasCoords ? (data.latitude ?? null) : null,
    longitude: hasCoords ? (data.longitude ?? null) : null,
    language: data.language ?? null,
    theme: data.theme ?? null,
    profilePictureUrl: data.profile_picture_url ?? null,
    phoneNumber: data.phone_number ?? null,
    pendingEmail: pendingEmail,
    sharePhoneWithMatches: data.share_phone_with_matches ?? null,
    phoneChanged,
  });

  if (emailChanged) {
    try {
      await requestEmailVerification(userId, clientIp);
    } catch (error) {
      // Clear pendingEmail so the account doesn't have an orphaned pending state
      await repo.updateAccount(userId, { pendingEmail: null });
      throw error;
    }
  }
}

/** Soft-deletes the account and sends confirmation email. */
export async function deleteAccount(userId: string): Promise<void> {
  const account = await repo.findById(userId);

  const deletedAt = new Date();
  const restoreUntil = addDays(deletedAt, 30);
  const restoreUntilDate = format(restoreUntil, "MMMM d, yyyy");

  await repo.deleteAccount(userId);

  try {
    await sendAccountDeletionEmail(
      account.email,
      account.language ?? "tr",
      restoreUntilDate,
    );
  } catch (error) {
    logger.error(
      { error, userId, email: account.email },
      "Failed to send account deletion email",
    );
  }
}

/** Restores a soft-deleted account. Fails if restore period (30 days) has expired. */
export async function restoreAccount(userId: string): Promise<void> {
  const account = await repo.findByIdIncludingDeleted(userId);

  if (!account.deletedAt) {
    throw AppError.validation("Account is not deleted");
  }

  const RESTORE_PERIOD_DAYS = 30;
  const msSinceDeletion = Date.now() - account.deletedAt.getTime();
  const daysSinceDeletion = Math.floor(msSinceDeletion / (1000 * 60 * 60 * 24));

  if (daysSinceDeletion >= RESTORE_PERIOD_DAYS) {
    throw AppError.validation("Restore period has expired");
  }

  await repo.restoreAccount(userId);
}

/** Verifies the user's password. Returns true if correct, false otherwise. */
export async function verifyUserPassword(
  userId: string,
  password: string,
): Promise<boolean> {
  const account = await repo.findById(userId);
  const valid = await verifyPassword(password, account.password);
  return valid;
}

/** Changes the account password after verifying the current one. Invalidates all existing tokens. */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const account = await repo.findById(userId);
  const valid = await verifyPassword(currentPassword, account.password);
  if (!valid) throw AppError.unauthorized("Current password is incorrect");

  const hash = await hashPassword(newPassword);
  await repo.updatePassword(userId, hash);
  await repo.incrementTokenVersion(userId);
}

/** Updates the account location coordinates. */
export async function updateLocation(
  userId: string,
  lat: number,
  lng: number,
): Promise<void> {
  await repo.updateLocation(userId, lat, lng);
}

/** Updates the push notification token. */
export async function updatePushToken(
  userId: string,
  token: string | null,
): Promise<void> {
  await repo.updatePushToken(userId, token);
}

// ---------------------------------------------------------------------------
// Phone verification
// ---------------------------------------------------------------------------

/** Generates an OTP and saves it for phone verification. Updates the account phone number. */
export async function requestPhoneVerification(
  userId: string,
  phoneNumber: string,
): Promise<void> {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await repo.upsertPhoneVerificationCode(userId, code, expiresAt);
  await repo.updateAccount(userId, {
    phoneNumber,
    phoneChanged: true,
  });

  logger.info(
    { userId },
    "Phone verification code generated (SMS not implemented)",
  );
}

/** Verifies a phone number using the provided OTP code. */
export async function verifyPhone(userId: string, code: string): Promise<void> {
  const record = await repo.getPhoneVerificationCode(userId);
  if (!record) throw AppError.validation("No verification code found");
  if (record.expiresAt < new Date())
    throw AppError.validation("Verification code expired");

  if (record.verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
    await repo.deletePhoneVerificationCode(userId);
    throw AppError.rateLimited(
      "Too many failed attempts. Please request a new code.",
    );
  }

  if (!constantTimeEq(record.code.trim(), code.trim())) {
    await repo.incrementPhoneVerifyAttempts(userId);
    throw AppError.validation("Invalid verification code");
  }

  await repo.verifyPhoneNumber(userId);
}
