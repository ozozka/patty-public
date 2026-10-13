import { db } from "@patty/api/db/client";
import {
  accounts,
  emailVerificationCodes,
  passwordResetCodes,
  phoneVerificationCodes,
} from "@patty/api/db/schema";
import { AppError } from "@patty/api/lib/errors";
import { and, eq, isNotNull, isNull, or, sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Account read shape (password excluded from API responses)
// ---------------------------------------------------------------------------

export interface AccountRow {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Password hash — never serialize to clients. */
  password: string;
  bio: string | null;
  homeLocationId: number | null;
  latitude: number | null;
  longitude: number | null;
  language: string;
  theme: string;
  profilePictureUrl: string | null;
  phoneNumber: string | null;
  phoneVerified: boolean;
  sharePhoneWithMatches: boolean;
  tokenVersion: number;
  isOnline: boolean;
  lastSeenAt: Date | null;
  pushToken: string | null;
  status: "unverified" | "verified" | "banned";
  pendingEmail: string | null;
  locationPrecision: "exact" | "city";
  deletedAt: Date | null;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapAccount(r: typeof accounts.$inferSelect): AccountRow {
  return {
    id: r.id,
    username: r.username,
    email: r.email,
    firstName: r.firstName,
    lastName: r.lastName,
    password: r.password,
    bio: r.bio ?? null,
    homeLocationId: r.homeLocationId ?? null,
    latitude: r.latitude ?? null,
    longitude: r.longitude ?? null,
    language: r.language,
    theme: r.theme,
    profilePictureUrl: r.profilePictureUrl ?? null,
    phoneNumber: r.phoneNumber ?? null,
    phoneVerified: r.phoneVerified,
    sharePhoneWithMatches: r.sharePhoneWithMatches,
    tokenVersion: r.tokenVersion,
    isOnline: r.isOnline,
    lastSeenAt: r.lastSeenAt ?? null,
    pushToken: r.pushToken ?? null,
    status: r.status,
    pendingEmail: r.pendingEmail ?? null,
    locationPrecision: r.locationPrecision,
    deletedAt: r.deletedAt ?? null,
    createdAt: r.createdAt ?? new Date(),
  };
}

// ---------------------------------------------------------------------------
// Account queries
// ---------------------------------------------------------------------------

/** Find an active (non-deleted) account by username or email (case-insensitive). */
export async function findByUsernameOrEmail(
  identifier: string,
): Promise<AccountRow> {
  const lower = identifier.toLowerCase();
  const row = await db
    .select()
    .from(accounts)
    .where(
      and(
        or(
          sql`LOWER(${accounts.username}) = ${lower}`,
          sql`LOWER(${accounts.email}) = ${lower}`,
        ),
        isNull(accounts.deletedAt),
      ),
    )
    .limit(1);

  const found = row[0];
  if (!found) throw AppError.unauthorized("Invalid credentials");
  return mapAccount(found);
}

/** Find an active (non-deleted) account by username or email, returns null if not found. */
export async function findByUsernameOrEmailOrNull(
  identifier: string,
): Promise<AccountRow | null> {
  const lower = identifier.toLowerCase();
  const row = await db
    .select()
    .from(accounts)
    .where(
      and(
        or(
          sql`LOWER(${accounts.username}) = ${lower}`,
          sql`LOWER(${accounts.email}) = ${lower}`,
        ),
        isNull(accounts.deletedAt),
      ),
    )
    .limit(1);

  const found = row[0];
  if (!found) return null;
  return mapAccount(found);
}

/** Find a soft-deleted account by username or email. */
export async function findDeletedByUsernameOrEmail(
  identifier: string,
): Promise<AccountRow> {
  const lower = identifier.toLowerCase();
  const row = await db
    .select()
    .from(accounts)
    .where(
      or(
        sql`LOWER(${accounts.username}) = ${lower}`,
        sql`LOWER(${accounts.email}) = ${lower}`,
      ),
    )
    .limit(1);

  const found = row[0];
  if (!found) throw AppError.notFound("Account not found");
  return mapAccount(found);
}

/** Find an active account by email (returns full record including password). Used for E2E testing. */
export async function findByEmail(email: string): Promise<AccountRow | null> {
  const lower = email.toLowerCase();
  const row = await db
    .select()
    .from(accounts)
    .where(
      and(sql`LOWER(${accounts.email}) = ${lower}`, isNull(accounts.deletedAt)),
    )
    .limit(1);

  const found = row[0];
  if (!found) return null;
  return mapAccount(found);
}

/** Find a soft-deleted account by username or email, returns null if not found. */
export async function findDeletedByUsernameOrEmailOrNull(
  identifier: string,
): Promise<AccountRow | null> {
  const lower = identifier.toLowerCase();
  const row = await db
    .select()
    .from(accounts)
    .where(
      and(
        or(
          sql`LOWER(${accounts.username}) = ${lower}`,
          sql`LOWER(${accounts.email}) = ${lower}`,
        ),
        isNotNull(accounts.deletedAt),
      ),
    )
    .limit(1);

  const found = row[0];
  if (!found) return null;
  return mapAccount(found);
}

/** Find an active account by UUID. */
export async function findById(id: string): Promise<AccountRow> {
  const row = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, id), isNull(accounts.deletedAt)))
    .limit(1);

  const found = row[0];
  if (!found) throw AppError.unauthorized("Account not found");
  return mapAccount(found);
}

/** Find an account by UUID including soft-deleted ones. */
export async function findByIdIncludingDeleted(
  id: string,
): Promise<AccountRow> {
  const row = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, id))
    .limit(1);

  const found = row[0];
  if (!found) throw AppError.unauthorized("Account not found");
  return mapAccount(found);
}

/** Returns true if the account exists (including soft-deleted). */
export async function existsIncludingDeleted(id: string): Promise<boolean> {
  const row = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.id, id))
    .limit(1);
  return row.length > 0;
}

/**
 * Creates a new account.
 * @throws AppError.conflict if username/email is taken.
 */
export async function createAccount(params: {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  homeLocationId: number | null;
  latitude: number | null;
  longitude: number | null;
  language: string;
  theme: string;
  phoneNumber: string | null;
}): Promise<void> {
  try {
    // Use raw SQL to also set the PostGIS location column.
    await db.execute(sql`
      INSERT INTO accounts (
        id, username, email, first_name, last_name, password,
        home_location_id, latitude, longitude,
        location, language, theme, phone_number,
        is_online, last_seen_at, metadata
      ) VALUES (
        ${params.id}, ${params.username}, ${params.email},
        ${params.firstName}, ${params.lastName}, ${params.password},
        ${params.homeLocationId}, ${params.latitude}, ${params.longitude},
        ${
          params.latitude !== null && params.longitude !== null
            ? sql`ST_SetSRID(ST_MakePoint(${params.longitude}, ${params.latitude}), 4326)`
            : sql`NULL`
        },
        ${params.language}, ${params.theme}, ${params.phoneNumber},
        FALSE, NOW(), '{}'::jsonb
      )
    `);
  } catch (err) {
    // DrizzleQueryError wraps the postgres error in .cause — check both.
    // `"cause" in err` narrows err to have a cause property, no cast needed.
    const cause =
      typeof err === "object" && err !== null && "cause" in err
        ? err.cause
        : undefined;
    const pgMsg = [err, cause]
      .map((e) => (e instanceof Error ? e.message : ""))
      .join(" ");
    if (pgMsg.includes("unique") || pgMsg.includes("duplicate")) {
      throw AppError.conflict("username or email already exists");
    }
    if (pgMsg.includes("foreign key") || pgMsg.includes("violates foreign")) {
      throw AppError.validation("Invalid location ID");
    }
    throw AppError.internal(pgMsg);
  }
}

/** Partial update of account fields. Only non-null values overwrite existing data. */
export async function updateAccount(
  id: string,
  fields: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    bio?: string | null;
    homeLocationId?: number | null;
    latitude?: number | null;
    longitude?: number | null;
    language?: string | null;
    theme?: string | null;
    profilePictureUrl?: string | null;
    phoneNumber?: string | null;
    pendingEmail?: string | null;
    sharePhoneWithMatches?: boolean | null;
    phoneChanged?: boolean;
  },
): Promise<void> {
  const hasCoords =
    fields.latitude !== undefined &&
    fields.latitude !== null &&
    fields.longitude !== undefined &&
    fields.longitude !== null;

  await db.execute(sql`
    UPDATE accounts SET
      first_name = COALESCE(${fields.firstName ?? null}, first_name),
      last_name = COALESCE(${fields.lastName ?? null}, last_name),
      email = COALESCE(${fields.email ?? null}, email),
      bio = COALESCE(${fields.bio ?? null}, bio),
      home_location_id = COALESCE(${fields.homeLocationId ?? null}, home_location_id),
      latitude = COALESCE(${fields.latitude ?? null}, latitude),
      longitude = COALESCE(${fields.longitude ?? null}, longitude),
      location = ${
        hasCoords
          ? sql`ST_SetSRID(ST_MakePoint(${fields.longitude}, ${fields.latitude}), 4326)`
          : sql`location`
      },
      language = COALESCE(${fields.language ?? null}, language),
      theme = COALESCE(${fields.theme ?? null}, theme),
      profile_picture_url = COALESCE(${fields.profilePictureUrl ?? null}, profile_picture_url),
      phone_number = COALESCE(${fields.phoneNumber ?? null}, phone_number),
      pending_email = COALESCE(${fields.pendingEmail ?? null}, pending_email),
      share_phone_with_matches = COALESCE(${fields.sharePhoneWithMatches ?? null}, share_phone_with_matches),
      phone_verified = CASE WHEN ${fields.phoneChanged ?? false} THEN FALSE ELSE phone_verified END,
      last_seen_at = NOW()
    WHERE id = ${id} AND deleted_at IS NULL
  `);
}

/** Updates lat/lon and PostGIS location column for presence heartbeat. */
export async function updateLocation(
  id: string,
  lat: number,
  lon: number,
): Promise<void> {
  await db.execute(sql`
    UPDATE accounts
    SET latitude = ${lat},
        longitude = ${lon},
        location = ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326),
        last_seen_at = NOW()
    WHERE id = ${id} AND deleted_at IS NULL
  `);
}

/** Replaces the hashed password. */
export async function updatePassword(id: string, hash: string): Promise<void> {
  await db
    .update(accounts)
    .set({ password: hash, lastSeenAt: new Date() })
    .where(and(eq(accounts.id, id), isNull(accounts.deletedAt)));
}

/** Increments the token version, invalidating all existing JWTs. */
export async function incrementTokenVersion(id: string): Promise<void> {
  await db.execute(sql`
    UPDATE accounts SET token_version = token_version + 1
    WHERE id = ${id} AND deleted_at IS NULL
  `);
}

/** Replaces the push notification token. */
export async function updatePushToken(
  id: string,
  token: string | null,
): Promise<void> {
  await db
    .update(accounts)
    .set({ pushToken: token, lastSeenAt: new Date() })
    .where(and(eq(accounts.id, id), isNull(accounts.deletedAt)));
}

/** Soft-deletes the account. */
export async function deleteAccount(id: string): Promise<void> {
  await db
    .update(accounts)
    .set({ deletedAt: new Date() })
    .where(and(eq(accounts.id, id), isNull(accounts.deletedAt)));
}

/** Hard-deletes an account by email (used for E2E testing). */
export async function hardDeleteAccountByEmail(email: string): Promise<void> {
  await db
    .delete(accounts)
    .where(sql`LOWER(${accounts.email}) = ${email.toLowerCase()}`);
}

/** Restores a soft-deleted account. */
export async function restoreAccount(id: string): Promise<void> {
  await db
    .update(accounts)
    .set({ deletedAt: null })
    .where(and(eq(accounts.id, id), isNotNull(accounts.deletedAt)));
}

/** Returns all active (non-deleted) match partner IDs for a user. Used for presence broadcasts. */
export async function getMatchPartnerIds(userId: string): Promise<string[]> {
  const rows = await db.execute<{ partner_id: string }>(sql`
    SELECT
      CASE WHEN user_one_id = ${userId}::uuid THEN user_two_id::text
           ELSE user_one_id::text
      END AS partner_id
    FROM matches
    WHERE (user_one_id = ${userId}::uuid OR user_two_id = ${userId}::uuid)
      AND deleted_at IS NULL
  `);
  return rows.map((r) => r.partner_id);
}

/** Sets online/offline presence and refreshes last_seen_at. */
export async function setPresence(id: string, online: boolean): Promise<void> {
  await db
    .update(accounts)
    .set({ isOnline: online, lastSeenAt: new Date() })
    .where(and(eq(accounts.id, id), isNull(accounts.deletedAt)));
}

// ---------------------------------------------------------------------------
// Phone verification
// ---------------------------------------------------------------------------

/** Upserts a phone verification code (one per account). */
export async function upsertPhoneVerificationCode(
  accountId: string,
  code: string,
  expiresAt: Date,
): Promise<void> {
  await db.execute(sql`
    INSERT INTO phone_verification_codes (account_id, code, expires_at)
    VALUES (${accountId}, ${code}, ${expiresAt.toISOString()})
    ON CONFLICT (account_id) DO UPDATE
    SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at, created_at = NOW()
  `);
}

/** Returns the current phone verification code, its expiry, and verify attempts for an account. */
export async function getPhoneVerificationCode(
  accountId: string,
): Promise<{ code: string; expiresAt: Date; verifyAttempts: number } | null> {
  const row = await db
    .select({
      code: phoneVerificationCodes.code,
      expiresAt: phoneVerificationCodes.expiresAt,
      verifyAttempts: phoneVerificationCodes.verifyAttempts,
    })
    .from(phoneVerificationCodes)
    .where(eq(phoneVerificationCodes.accountId, accountId))
    .limit(1);

  const found = row[0];
  return found
    ? {
        code: found.code,
        expiresAt: found.expiresAt,
        verifyAttempts: found.verifyAttempts,
      }
    : null;
}

/** Increments the verify_attempts counter for a phone verification code. */
export async function incrementPhoneVerifyAttempts(
  accountId: string,
): Promise<void> {
  await db.execute(sql`
    UPDATE phone_verification_codes
    SET verify_attempts = verify_attempts + 1
    WHERE account_id = ${accountId}
  `);
}

/** Deletes the phone verification code (used when max attempts exceeded). */
export async function deletePhoneVerificationCode(
  accountId: string,
): Promise<void> {
  await db
    .delete(phoneVerificationCodes)
    .where(eq(phoneVerificationCodes.accountId, accountId));
}

/** Sets phone_verified = true and removes the verification code in one transaction. */
export async function verifyPhoneNumber(accountId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`UPDATE accounts SET phone_verified = TRUE, last_seen_at = NOW() WHERE id = ${accountId} AND deleted_at IS NULL`,
    );
    await tx
      .delete(phoneVerificationCodes)
      .where(eq(phoneVerificationCodes.accountId, accountId));
  });
}

// ---------------------------------------------------------------------------
// Email verification
// ---------------------------------------------------------------------------

export interface EmailVerificationCodeRow {
  code: string;
  attempts: number;
  verifyAttempts: number;
  dailyCount: number;
  lastDailyResetAt: Date;
  lastSentAt: Date;
  expiresAt: Date;
  createdAt: Date;
  lastIp: string | null;
}

/** Returns the current email verification record for the account, or null. */
export async function getEmailVerificationCode(
  accountId: string,
): Promise<EmailVerificationCodeRow | null> {
  const row = await db
    .select()
    .from(emailVerificationCodes)
    .where(eq(emailVerificationCodes.accountId, accountId))
    .limit(1);

  const found = row[0];
  if (!found) return null;

  return {
    code: found.code,
    attempts: found.attempts,
    verifyAttempts: found.verifyAttempts,
    dailyCount: found.dailyCount,
    lastDailyResetAt: found.lastDailyResetAt,
    lastSentAt: found.lastSentAt,
    expiresAt: found.expiresAt,
    createdAt: found.createdAt,
    lastIp: found.lastIp ?? null,
  };
}

/** Counts email verification codes sent from a specific IP in the last hour. */
export async function countEmailCodesByIp(ip: string): Promise<number> {
  const result = await db.execute<{ count: string }>(sql`
    SELECT COUNT(*)::text as count
    FROM email_verification_codes
    WHERE last_ip = ${ip} AND last_sent_at > NOW() - INTERVAL '1 hour'
  `);
  return parseInt(result[0]?.count ?? "0", 10);
}

/** Upserts an email verification code with rolling rate-limit counters. */
export async function upsertEmailVerificationCode(
  accountId: string,
  code: string,
  expiresAt: Date,
  clientIp: string | null,
): Promise<void> {
  await db.execute(sql`
    INSERT INTO email_verification_codes (
      account_id, code, expires_at, attempts, last_sent_at,
      daily_count, last_daily_reset_at, last_ip
    )
    VALUES (${accountId}, ${code}, ${expiresAt.toISOString()}, 1, NOW(), 1, NOW(), ${clientIp})
    ON CONFLICT (account_id) DO UPDATE
    SET code = EXCLUDED.code,
        expires_at = EXCLUDED.expires_at,
        attempts = CASE
          WHEN email_verification_codes.created_at < NOW() - INTERVAL '15 minutes' THEN 1
          ELSE email_verification_codes.attempts + 1
        END,
        daily_count = CASE
          WHEN email_verification_codes.last_daily_reset_at < NOW() - INTERVAL '24 hours' THEN 1
          ELSE email_verification_codes.daily_count + 1
        END,
        last_daily_reset_at = CASE
          WHEN email_verification_codes.last_daily_reset_at < NOW() - INTERVAL '24 hours' THEN NOW()
          ELSE email_verification_codes.last_daily_reset_at
        END,
        last_sent_at = NOW(),
        created_at = CASE
          WHEN email_verification_codes.created_at < NOW() - INTERVAL '15 minutes' THEN NOW()
          ELSE email_verification_codes.created_at
        END,
        last_ip = EXCLUDED.last_ip
  `);
}

/** Increments the verify_attempts counter for an email verification code. */
export async function incrementEmailVerifyAttempts(
  accountId: string,
): Promise<void> {
  await db.execute(sql`
    UPDATE email_verification_codes
    SET verify_attempts = verify_attempts + 1
    WHERE account_id = ${accountId}
  `);
}

/** Deletes the email verification code (used when max attempts exceeded). */
export async function deleteEmailVerificationCode(
  accountId: string,
): Promise<void> {
  await db
    .delete(emailVerificationCodes)
    .where(eq(emailVerificationCodes.accountId, accountId));
}

/** Sets status = 'verified' and removes the verification code in one transaction. */
export async function verifyEmail(accountId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`UPDATE accounts SET
            email = COALESCE(pending_email, email),
            pending_email = NULL,
            status = 'verified',
            last_seen_at = NOW()
          WHERE id = ${accountId} AND deleted_at IS NULL`,
    );
    await tx
      .delete(emailVerificationCodes)
      .where(eq(emailVerificationCodes.accountId, accountId));
  });
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export interface PasswordResetCodeRow {
  code: string;
  attempts: number;
  verifyAttempts: number;
  dailyCount: number;
  lastDailyResetAt: Date;
  lastSentAt: Date;
  expiresAt: Date;
  createdAt: Date;
  lastIp: string | null;
}

/** Returns the current password reset record for the account, or null. */
export async function getPasswordResetCode(
  accountId: string,
): Promise<PasswordResetCodeRow | null> {
  const row = await db
    .select()
    .from(passwordResetCodes)
    .where(eq(passwordResetCodes.accountId, accountId))
    .limit(1);

  const found = row[0];
  if (!found) return null;

  return {
    code: found.code,
    attempts: found.attempts,
    verifyAttempts: found.verifyAttempts,
    dailyCount: found.dailyCount,
    lastDailyResetAt: found.lastDailyResetAt,
    lastSentAt: found.lastSentAt,
    expiresAt: found.expiresAt,
    createdAt: found.createdAt,
    lastIp: found.lastIp ?? null,
  };
}

/** Counts password reset codes sent from a specific IP in the last hour. */
export async function countPasswordResetCodesByIp(ip: string): Promise<number> {
  const result = await db.execute<{ count: string }>(sql`
    SELECT COUNT(*)::text as count
    FROM password_reset_codes
    WHERE last_ip = ${ip} AND last_sent_at > NOW() - INTERVAL '1 hour'
  `);
  return parseInt(result[0]?.count ?? "0", 10);
}

/** Upserts a password reset code with rolling rate-limit counters. */
export async function upsertPasswordResetCode(
  accountId: string,
  code: string,
  expiresAt: Date,
  clientIp: string | null,
): Promise<void> {
  await db.execute(sql`
    INSERT INTO password_reset_codes (
      account_id, code, expires_at, attempts, last_sent_at,
      daily_count, last_daily_reset_at, last_ip
    )
    VALUES (${accountId}, ${code}, ${expiresAt.toISOString()}, 1, NOW(), 1, NOW(), ${clientIp})
    ON CONFLICT (account_id) DO UPDATE
    SET code = EXCLUDED.code,
        expires_at = EXCLUDED.expires_at,
        attempts = CASE
          WHEN password_reset_codes.created_at < NOW() - INTERVAL '15 minutes' THEN 1
          ELSE password_reset_codes.attempts + 1
        END,
        daily_count = CASE
          WHEN password_reset_codes.last_daily_reset_at < NOW() - INTERVAL '24 hours' THEN 1
          ELSE password_reset_codes.daily_count + 1
        END,
        last_daily_reset_at = CASE
          WHEN password_reset_codes.last_daily_reset_at < NOW() - INTERVAL '24 hours' THEN NOW()
          ELSE password_reset_codes.last_daily_reset_at
        END,
        last_sent_at = NOW(),
        created_at = CASE
          WHEN password_reset_codes.created_at < NOW() - INTERVAL '15 minutes' THEN NOW()
          ELSE password_reset_codes.created_at
        END,
        last_ip = EXCLUDED.last_ip
  `);
}

/** Increments the verify_attempts counter for a password reset code. */
export async function incrementPasswordResetVerifyAttempts(
  accountId: string,
): Promise<void> {
  await db.execute(sql`
    UPDATE password_reset_codes
    SET verify_attempts = verify_attempts + 1
    WHERE account_id = ${accountId}
  `);
}

/** Removes the password reset code for an account. */
export async function deletePasswordResetCode(
  accountId: string,
): Promise<void> {
  await db
    .delete(passwordResetCodes)
    .where(eq(passwordResetCodes.accountId, accountId));
}
