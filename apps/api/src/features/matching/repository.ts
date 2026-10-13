import { db } from "@patty/api/db/client";
import { AppError } from "@patty/api/lib/errors";
import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PetCandidate {
  id: string;
  account_id: string;
  name: string;
  breed_id: number;
  breed_name: string | null;
  location_name: string | null;
  distance_m: number | null;
  birth_date: string | null;
  photos: string[];
  bio: string | null;
  gender: "male" | "female";
  energy_level: number | null;
  created_at: Date;
}

type PetCandidateRaw = Record<string, unknown> & {
  id: string;
  account_id: string;
  name: string;
  breed_id: number;
  breed_name: string | null;
  location_name: string | null;
  distance_m: number | null;
  birth_date: string | null;
  photos: string[];
  bio: string | null;
  gender: "male" | "female";
  energy_level: number | null;
  created_at: Date;
};

export type MatchRow = Record<string, unknown> & {
  match_id: string;
  match_created_at: Date;
  last_message_id: string | null;
  last_message_sender_id: string | null;
  last_message_type: "text" | "image" | "location" | null;
  last_message_preview: string | null;
  last_message_at: Date | null;
  user_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  home_location_id: number | null;
  latitude: number | null;
  longitude: number | null;
  language: string;
  theme: string;
  profile_picture_url: string | null;
  phone_number: string | null;
  phone_verified: boolean;
  share_phone_with_matches: boolean;
  is_online: boolean;
  last_seen_at: Date | null;
  metadata: unknown;
  deleted_at: Date | null;
  status: "unverified" | "verified" | "banned";
  location_precision: "exact" | "city";
  user_created_at: Date;
};

// ---------------------------------------------------------------------------
// Candidate discovery
// ---------------------------------------------------------------------------

/**
 * Returns matching candidates for the given active pet.
 * Excludes pets already swiped, blocked users, and the swiping user's own pets.
 * Filters by gender preferences and optionally by distance.
 */
export async function getCandidates(
  activePetId: string,
  limit: number,
  radiusKm: number | null,
): Promise<PetCandidate[]> {
  const radiusM = radiusKm !== null ? radiusKm * 1000 : null;

  const rows = await db.execute<PetCandidateRaw>(sql`
    WITH active_pet AS (
      SELECT p.gender, p.matching_preferences, p.account_id, p.breed_id, a.location
      FROM pets p
      JOIN accounts a ON p.account_id = a.id
      WHERE p.id = ${activePetId}::uuid
    )
    SELECT
      p.id::text,
      p.account_id::text,
      p.name,
      p.breed_id,
      b.name_en AS breed_name,
      l.name_tr AS location_name,
      ST_Distance(a.location, ap.location)::double precision AS distance_m,
      p.birth_date::text AS birth_date,
      COALESCE(
        (SELECT ARRAY_AGG(pp.image_url ORDER BY pp.display_order, pp.created_at)
         FROM pet_photos pp WHERE pp.pet_id = p.id),
        ARRAY[]::TEXT[]
      ) AS photos,
      p.bio,
      p.gender,
      p.energy_level,
      p.created_at
    FROM pets p
    JOIN accounts a ON p.account_id = a.id
    CROSS JOIN active_pet ap
    LEFT JOIN breeds b ON p.breed_id = b.id
    LEFT JOIN locations l ON a.home_location_id = l.id
    WHERE p.id != ${activePetId}::uuid
      AND p.account_id != ap.account_id
      AND p.breed_id = ap.breed_id
      AND p.gender = ANY(ap.matching_preferences)
      AND ap.gender = ANY(p.matching_preferences)
      AND p.deleted_at IS NULL
      AND a.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM swipes s
        WHERE s.target_pet_id = p.id AND s.active_pet_id = ${activePetId}::uuid
      )
      AND NOT EXISTS (
        SELECT 1 FROM user_blocks ub
        WHERE (ub.blocker_id = ap.account_id AND ub.blocked_id = p.account_id)
           OR (ub.blocker_id = p.account_id AND ub.blocked_id = ap.account_id)
      )
      AND (${radiusM}::double precision IS NULL OR ST_Distance(a.location, ap.location) <= ${radiusM})
    ORDER BY distance_m ASC NULLS LAST
    LIMIT ${limit}
  `);

  return rows.map((r) => ({
    id: r.id,
    account_id: r.account_id,
    name: r.name,
    breed_id: r.breed_id,
    breed_name: r.breed_name,
    location_name: r.location_name,
    distance_m: r.distance_m,
    birth_date: r.birth_date,
    photos: Array.isArray(r.photos) ? r.photos : [],
    bio: r.bio,
    gender: r.gender,
    energy_level: r.energy_level,
    created_at: r.created_at,
  }));
}

// ---------------------------------------------------------------------------
// Swipe recording
// ---------------------------------------------------------------------------

/** Records a swipe action. */
export async function recordSwipe(
  swiperUserId: string,
  activePetId: string,
  targetPetId: string,
  action: "like" | "dislike",
): Promise<void> {
  await db.execute(sql`
    INSERT INTO swipes (id, swiper_user_id, active_pet_id, target_pet_id, action)
    VALUES (
      ${randomUUID()}::uuid,
      ${swiperUserId}::uuid,
      ${activePetId}::uuid,
      ${targetPetId}::uuid,
      ${action}::swipe_action
    )
  `);
}

/** Returns the account_id that owns the given pet. */
export async function getPetOwnerId(petId: string): Promise<string> {
  const result = await db.execute<{ account_id: string }>(sql`
    SELECT account_id::text FROM pets WHERE id = ${petId}::uuid
  `);
  const row = result[0];
  if (!row) throw AppError.notFound("Pet not found");
  return row.account_id;
}

/** Checks if target_owner_id has already liked active_pet_id. */
export async function checkMutualLike(
  targetOwnerId: string,
  activePetId: string,
): Promise<boolean> {
  const result = await db.execute<{ exists: boolean }>(sql`
    SELECT EXISTS(
      SELECT 1 FROM swipes
      WHERE swiper_user_id = ${targetOwnerId}::uuid
        AND target_pet_id = ${activePetId}::uuid
        AND action = 'like'::swipe_action
    ) AS exists
  `);
  return result[0]?.exists ?? false;
}

// ---------------------------------------------------------------------------
// Match CRUD
// ---------------------------------------------------------------------------

/** Finds an existing active match between two ordered users. */
export async function findExistingMatch(
  userOneId: string,
  userTwoId: string,
): Promise<string | null> {
  const result = await db.execute<{ id: string }>(sql`
    SELECT id::text FROM matches
    WHERE user_one_id = ${userOneId}::uuid
      AND user_two_id = ${userTwoId}::uuid
      AND deleted_at IS NULL
  `);
  return result[0]?.id ?? null;
}

/**
 * Creates a match between two users (canonical order: lower UUID first).
 * Uses ON CONFLICT to handle races gracefully.
 */
export async function createMatch(
  userOneId: string,
  userTwoId: string,
): Promise<string> {
  const matchId = randomUUID();
  const result = await db.execute<{ id: string }>(sql`
    INSERT INTO matches (id, user_one_id, user_two_id)
    VALUES (${matchId}::uuid, ${userOneId}::uuid, ${userTwoId}::uuid)
    ON CONFLICT (user_one_id, user_two_id) DO UPDATE SET user_one_id = matches.user_one_id
    RETURNING id::text
  `);
  const row = result[0];
  if (!row) throw AppError.internal("Failed to create match");
  return row.id;
}

/** Returns all active match rows for a user with denormalized last-message data. */
export async function getMatches(userId: string): Promise<MatchRow[]> {
  const rows = await db.execute<MatchRow>(sql`
    SELECT
      m.id::text AS match_id,
      m.created_at AS match_created_at,
      m.last_message_id::text AS last_message_id,
      m.last_message_sender_id::text AS last_message_sender_id,
      m.last_message_type,
      m.last_message_preview,
      m.last_message_at,
      a.id::text AS user_id,
      a.username,
      a.email,
      a.first_name,
      a.last_name,
      a.bio,
      a.home_location_id,
      a.latitude,
      a.longitude,
      a.language,
      a.theme,
      a.profile_picture_url,
      a.phone_number,
      a.phone_verified,
      a.share_phone_with_matches,
      a.is_online,
      a.last_seen_at,
      a.metadata,
      a.deleted_at,
      a.status,
      a.location_precision,
      a.created_at AS user_created_at
    FROM matches m
    JOIN accounts a
      ON (m.user_one_id = a.id OR m.user_two_id = a.id)
      AND a.id != ${userId}::uuid
    WHERE (m.user_one_id = ${userId}::uuid OR m.user_two_id = ${userId}::uuid)
      AND m.deleted_at IS NULL
      AND a.deleted_at IS NULL
    ORDER BY m.created_at DESC
  `);
  return rows;
}

/** Returns the participants of a match as [userOneId, userTwoId]. */
export async function getMatchParticipants(
  matchId: string,
): Promise<[string, string]> {
  const result = await db.execute<{
    user_one_id: string;
    user_two_id: string;
  }>(sql`
    SELECT user_one_id::text, user_two_id::text
    FROM matches WHERE id = ${matchId}::uuid AND deleted_at IS NULL
  `);
  const row = result[0];
  if (!row) throw AppError.notFound("Match not found");
  return [row.user_one_id, row.user_two_id];
}

/** Soft-deletes a match. */
export async function softDeleteMatch(matchId: string): Promise<void> {
  await db.execute(sql`
    UPDATE matches SET deleted_at = NOW() WHERE id = ${matchId}::uuid
  `);
}

/** Returns unread counts per match for a user. */
export async function getUnreadCounts(
  userId: string,
  matchIds: string[],
): Promise<Map<string, number>> {
  if (matchIds.length === 0) return new Map();

  const idList = sql.join(
    matchIds.map((id) => sql`${id}::uuid`),
    sql`, `,
  );
  const rows = await db.execute<{ match_id: string; count: string }>(sql`
    SELECT match_id::text, COUNT(*)::text AS count
    FROM messages
    WHERE match_id = ANY(ARRAY[${idList}])
      AND sender_id != ${userId}::uuid
      AND is_read = false
    GROUP BY match_id
  `);

  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.match_id, parseInt(row.count, 10));
  }
  return map;
}
