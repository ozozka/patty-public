import { db } from "@patty/api/db/client";
import { AppError } from "@patty/api/lib/errors";
import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MessageType = "text" | "image" | "location";

export interface MessageRow {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  is_read: boolean;
  reply_to_id: string | null;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  created_at: Date;
}

type MessageRaw = Record<string, unknown> & MessageRow;

// ---------------------------------------------------------------------------
// Participant helpers
// ---------------------------------------------------------------------------

/** Returns true if the user is a participant of the given active match. */
export async function isMatchParticipant(
  matchId: string,
  userId: string,
): Promise<boolean> {
  const result = await db.execute<{ exists: boolean }>(sql`
    SELECT EXISTS(
      SELECT 1 FROM matches
      WHERE id = ${matchId}::uuid
        AND deleted_at IS NULL
        AND (user_one_id = ${userId}::uuid OR user_two_id = ${userId}::uuid)
    ) AS exists
  `);
  return result[0]?.exists ?? false;
}

/** Returns the other participant's user ID for a match. */
export async function getOtherParticipant(
  matchId: string,
  userId: string,
): Promise<string | null> {
  const result = await db.execute<{ other_id: string }>(sql`
    SELECT
      CASE
        WHEN user_one_id = ${userId}::uuid THEN user_two_id::text
        ELSE user_one_id::text
      END AS other_id
    FROM matches
    WHERE id = ${matchId}::uuid AND deleted_at IS NULL
  `);
  return result[0]?.other_id ?? null;
}

// ---------------------------------------------------------------------------
// Message queries
// ---------------------------------------------------------------------------

/** Fetches paginated messages for a match (cursor = ISO timestamp for before-cursor pagination). */
export async function getMessages(
  matchId: string,
  limit: number,
  cursor: string | null,
): Promise<MessageRow[]> {
  const rows = await db.execute<MessageRaw>(sql`
    SELECT
      id::text, match_id::text, sender_id::text,
      content, message_type, is_read::boolean as is_read,
      reply_to_id::text AS reply_to_id,
      latitude::double precision as latitude, longitude::double precision as longitude, location_name, created_at
    FROM messages
    WHERE match_id = ${matchId}::uuid
      AND (${cursor}::timestamptz IS NULL OR created_at < ${cursor}::timestamptz)
    ORDER BY created_at DESC
    LIMIT ${limit}
  `);
  return rows;
}

/** Fetches a single message by ID. */
export async function getMessageById(
  messageId: string,
): Promise<MessageRow | null> {
  const rows = await db.execute<MessageRaw>(sql`
    SELECT
      id::text, match_id::text, sender_id::text,
      content, message_type, is_read::boolean as is_read,
      reply_to_id::text AS reply_to_id,
      latitude::double precision as latitude, longitude::double precision as longitude, location_name, created_at
    FROM messages WHERE id = ${messageId}::uuid
  `);
  return rows[0] ?? null;
}

/** Batch-fetches messages by IDs. */
export async function getMessagesByIds(ids: string[]): Promise<MessageRow[]> {
  if (ids.length === 0) return [];
  const idList = sql.join(
    ids.map((id) => sql`${id}::uuid`),
    sql`, `,
  );
  const rows = await db.execute<MessageRaw>(sql`
    SELECT
      id::text, match_id::text, sender_id::text,
      content, message_type, is_read::boolean as is_read,
      reply_to_id::text AS reply_to_id,
      latitude::double precision as latitude, longitude::double precision as longitude, location_name, created_at
    FROM messages WHERE id = ANY(ARRAY[${idList}])
  `);
  return rows;
}

/** Creates a new message, resolving location name if coordinates are provided. */
export async function createMessage(
  matchId: string,
  senderId: string,
  content: string,
  messageType: MessageType,
  replyToId: string | null,
  latitude: string | null,
  longitude: string | null,
): Promise<MessageRow> {
  // Resolve location name from PostGIS if lat/lon are present.
  let locationName: string | null = null;
  if (latitude !== null && longitude !== null) {
    const loc = await db.execute<{ name: string | null }>(sql`
      SELECT name_tr AS name FROM locations
      WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint(${parseFloat(longitude)}, ${parseFloat(latitude)}), 4326))
      ORDER BY level DESC LIMIT 1
    `);
    locationName = loc[0]?.name ?? null;
  }

  const id = randomUUID();
  const rows = await db.execute<MessageRaw>(sql`
    INSERT INTO messages (id, match_id, sender_id, content, message_type, reply_to_id, latitude, longitude, location_name)
    VALUES (
      ${id}::uuid, ${matchId}::uuid, ${senderId}::uuid,
      ${content}, ${messageType}::message_type,
      ${replyToId}::uuid,
      ${latitude}, ${longitude}, ${locationName}
    )
    RETURNING
      id::text, match_id::text, sender_id::text,
      content, message_type, is_read::boolean as is_read,
      reply_to_id::text AS reply_to_id,
      latitude::double precision as latitude, longitude::double precision as longitude, location_name, created_at
  `);
  const row = rows[0];
  if (!row) throw AppError.internal("Failed to create message");
  return row;
}

/** Marks all unread messages up to and including the given message as read. */
export async function markAsReadUpTo(
  matchId: string,
  lastReadMessageId: string,
): Promise<void> {
  await db.execute(sql`
    UPDATE messages
    SET is_read = true
    WHERE match_id = ${matchId}::uuid
      AND is_read = false
      AND created_at <= (
        SELECT created_at FROM messages WHERE id = ${lastReadMessageId}::uuid
      )
  `);
}

/** Updates the denormalized last-message snapshot on the matches table. */
export async function updateMatchLastMessage(
  message: MessageRow,
): Promise<void> {
  const preview =
    message.message_type === "text"
      ? message.content.slice(0, 120)
      : message.message_type === "image"
        ? "📷 Photo"
        : "📍 Location";

  await db.execute(sql`
    UPDATE matches SET
      last_message_id = ${message.id}::uuid,
      last_message_sender_id = ${message.sender_id}::uuid,
      last_message_type = ${message.message_type}::message_type,
      last_message_preview = ${preview},
      last_message_at = ${message.created_at}
    WHERE id = ${message.match_id}::uuid
  `);
}
