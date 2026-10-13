import { db } from "@patty/api/db/client";
import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReportReason =
  | "spam"
  | "inappropriate"
  | "harassment"
  | "fraud"
  | "other";
export type ReportTargetType = "account" | "pet" | "message";

export interface BlockedUserRow {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
}

type BlockedUserRaw = Record<string, unknown> & BlockedUserRow;

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------

/** Inserts a block record. Ignores conflicts (idempotent). */
export async function blockUser(
  blockerId: string,
  blockedId: string,
): Promise<void> {
  await db.execute(sql`
    INSERT INTO user_blocks (blocker_id, blocked_id)
    VALUES (${blockerId}::uuid, ${blockedId}::uuid)
    ON CONFLICT DO NOTHING
  `);
}

/** Removes a block record. */
export async function unblockUser(
  blockerId: string,
  blockedId: string,
): Promise<void> {
  await db.execute(sql`
    DELETE FROM user_blocks
    WHERE blocker_id = ${blockerId}::uuid AND blocked_id = ${blockedId}::uuid
  `);
}

/** Returns all users blocked by the given user. */
export async function getBlockedUsers(
  blockerId: string,
): Promise<BlockedUserRow[]> {
  const rows = await db.execute<BlockedUserRaw>(sql`
    SELECT a.id::text, a.username, a.first_name, a.last_name, a.profile_picture_url
    FROM user_blocks ub
    JOIN accounts a ON ub.blocked_id = a.id
    WHERE ub.blocker_id = ${blockerId}::uuid
      AND a.deleted_at IS NULL
    ORDER BY ub.created_at DESC
  `);
  return rows;
}

/** Returns true if blockerId has blocked blockedId. */
export async function isBlocked(
  blockerId: string,
  blockedId: string,
): Promise<boolean> {
  const result = await db.execute<{ exists: boolean }>(sql`
    SELECT EXISTS(
      SELECT 1 FROM user_blocks
      WHERE blocker_id = ${blockerId}::uuid AND blocked_id = ${blockedId}::uuid
    ) AS exists
  `);
  return result[0]?.exists ?? false;
}

/** Returns the match ID between two users if one exists and is not deleted. */
export async function findMatchBetween(
  userAId: string,
  userBId: string,
): Promise<string | null> {
  const [u1, u2] = userAId < userBId ? [userAId, userBId] : [userBId, userAId];
  const result = await db.execute<{ id: string }>(sql`
    SELECT id::text FROM matches
    WHERE user_one_id = ${u1}::uuid AND user_two_id = ${u2}::uuid AND deleted_at IS NULL
  `);
  return result[0]?.id ?? null;
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

/** Inserts a report. Returns the new report ID. */
export async function createReport(
  reporterId: string,
  targetType: ReportTargetType,
  reason: ReportReason,
  targetAccountId: string | null,
  targetPetId: string | null,
  targetMessageId: string | null,
): Promise<string> {
  const id = randomUUID();
  await db.execute(sql`
    INSERT INTO reports (id, reporter_id, target_type, reason, target_account_id, target_pet_id, target_message_id)
    VALUES (
      ${id}::uuid, ${reporterId}::uuid, ${targetType}::report_target_type, ${reason}::report_reason,
      ${targetAccountId}::uuid, ${targetPetId}::uuid, ${targetMessageId}::uuid
    )
  `);
  return id;
}
