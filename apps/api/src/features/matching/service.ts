import { AppError } from "@patty/api/lib/errors";
import { eventBus } from "@patty/api/lib/events";
import { getPresenceBatch } from "@patty/api/lib/presence";
import { wsManager } from "@patty/api/ws/manager";

import type { MatchRow, PetCandidate } from "./repository";
import * as repo from "./repository";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SwipeResult {
  match_id: string | null;
  is_match: boolean;
}

interface FormattedMatch {
  id: string;
  other_user: {
    id: string;
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
    status: "unverified" | "verified" | "banned";
    location_precision: "exact" | "city";
    created_at: Date;
  };
  last_message: {
    id: string;
    match_id: string;
    sender_id: string | null;
    content: string | null;
    message_type: "text" | "image" | "location" | null;
    is_read: boolean;
    created_at: Date | null;
    reply_to_id: null;
  } | null;
  created_at: Date;
  unread_count: number;
  is_online: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Two-minute threshold for online presence. */
const ONLINE_THRESHOLD_MS = 2 * 60_000;

// ---------------------------------------------------------------------------
// Candidates
// ---------------------------------------------------------------------------

/** Returns matching candidates for the given active pet. */
export async function getCandidates(
  activePetId: string,
  limit: number,
  radiusKm: number | null,
): Promise<PetCandidate[]> {
  return repo.getCandidates(activePetId, limit, radiusKm);
}

// ---------------------------------------------------------------------------
// Swipe
// ---------------------------------------------------------------------------

/** Records a swipe and detects mutual likes, creating a match when appropriate. */
export async function registerSwipe(
  userId: string,
  activePetId: string,
  targetPetId: string,
  action: "like" | "pass",
): Promise<SwipeResult> {
  const dbAction = action === "like" ? "like" : "dislike";
  await repo.recordSwipe(userId, activePetId, targetPetId, dbAction);

  if (action !== "like") {
    return { match_id: null, is_match: false };
  }

  const targetOwnerId = await repo.getPetOwnerId(targetPetId);

  // Prevent self-matching.
  if (userId === targetOwnerId) {
    return { match_id: null, is_match: false };
  }

  const mutualLike = await repo.checkMutualLike(targetOwnerId, activePetId);
  if (!mutualLike) {
    return { match_id: null, is_match: false };
  }

  // Mutual like — create or find the match (canonical user order).
  const [u1, u2] =
    userId < targetOwnerId ? [userId, targetOwnerId] : [targetOwnerId, userId];

  const existing = await repo.findExistingMatch(u1, u2);
  const matchId = existing ?? (await repo.createMatch(u1, u2));
  const isNew = !existing;

  if (isNew) {
    eventBus.emit("match.created", { matchId, userOneId: u1, userTwoId: u2 });

    // Shape must match wsMatchCreatedSchema — other_user_id is per-recipient.
    wsManager.send(u1, {
      type: "MatchCreated",
      payload: { match_id: matchId, other_user_id: u2 },
    });
    wsManager.send(u2, {
      type: "MatchCreated",
      payload: { match_id: matchId, other_user_id: u1 },
    });
  }

  return { match_id: matchId, is_match: true };
}

// ---------------------------------------------------------------------------
// Match list
// ---------------------------------------------------------------------------

/** Computes effective online status from is_online flag and last_seen_at timestamp. */
export function computeOnlineStatus(
  isOnline: boolean,
  lastSeenAt: Date | null,
): boolean {
  if (!isOnline) return false;
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;
}

/** Formats a raw match row into the API response shape. */
function formatMatchRow(
  row: MatchRow,
  unreadCount: number,
  // Live Redis presence for the other_user — merged with DB fallback.
  presence?: { isOnline: boolean; lastSeenAt: string | null },
): FormattedMatch {
  // Merge Redis live state with DB snapshot — same pattern as the profile endpoint:
  // prefer Redis when the key exists, fall back to DB on Redis miss or error.
  const isOnlineMerged = presence?.isOnline || row.is_online;
  const lastSeenAtMerged =
    presence?.lastSeenAt != null
      ? new Date(presence.lastSeenAt)
      : row.last_seen_at;
  const isOnline = computeOnlineStatus(isOnlineMerged, lastSeenAtMerged);

  const lastMessage = row.last_message_id
    ? {
        id: row.last_message_id,
        match_id: row.match_id,
        sender_id: row.last_message_sender_id,
        content: row.last_message_preview,
        message_type: row.last_message_type,
        is_read: true,
        created_at: row.last_message_at,
        reply_to_id: null,
      }
    : null;

  const phoneNumber =
    row.phone_verified && row.share_phone_with_matches
      ? row.phone_number
      : null;

  return {
    id: row.match_id,
    other_user: {
      id: row.user_id,
      username: row.username,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      bio: row.bio,
      home_location_id: row.home_location_id,
      latitude: row.latitude,
      longitude: row.longitude,
      language: row.language,
      theme: row.theme,
      profile_picture_url: row.profile_picture_url,
      phone_number: phoneNumber,
      phone_verified: row.phone_verified,
      share_phone_with_matches: row.share_phone_with_matches,
      is_online: isOnlineMerged,
      last_seen_at: lastSeenAtMerged,
      status: row.status,
      location_precision: row.location_precision,
      created_at: row.user_created_at,
    },
    last_message: lastMessage,
    created_at: row.match_created_at,
    unread_count: unreadCount,
    is_online: isOnline,
  };
}

/** Returns formatted and sorted matches for a user. */
export async function listMatches(userId: string): Promise<FormattedMatch[]> {
  const matchRows = await repo.getMatches(userId);

  const matchIds = matchRows.map((r) => r.match_id);
  const partnerIds = matchRows.map((r) => r.user_id);

  // Run unread counts and Redis presence batch in parallel.
  const [unreadMap, presenceMap] = await Promise.all([
    repo.getUnreadCounts(userId, matchIds),
    getPresenceBatch(partnerIds),
  ]);

  const matches = matchRows.map((row) =>
    formatMatchRow(
      row,
      unreadMap.get(row.match_id) ?? 0,
      presenceMap.get(row.user_id),
    ),
  );

  // Sort by last message date descending, fall back to match creation date.
  matches.sort((a, b) => {
    const aTime = new Date(
      a.last_message?.created_at ?? a.created_at,
    ).getTime();
    const bTime = new Date(
      b.last_message?.created_at ?? b.created_at,
    ).getTime();
    return bTime - aTime;
  });

  return matches;
}

// ---------------------------------------------------------------------------
// Unmatch
// ---------------------------------------------------------------------------

/** Validates participant access, soft-deletes the match, and broadcasts events. */
export async function unmatch(userId: string, matchId: string): Promise<void> {
  const [u1, u2] = await repo.getMatchParticipants(matchId);

  if (u1 !== userId && u2 !== userId) {
    throw AppError.unauthorized();
  }

  await repo.softDeleteMatch(matchId);

  // Shape must match wsMatchDeletedSchema.
  wsManager.send(u1, { type: "MatchDeleted", payload: { match_id: matchId } });
  wsManager.send(u2, { type: "MatchDeleted", payload: { match_id: matchId } });
}
