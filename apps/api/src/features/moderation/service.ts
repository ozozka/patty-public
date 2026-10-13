import * as matchingService from "@patty/api/features/matching/service";
import { AppError } from "@patty/api/lib/errors";

import * as repo from "./repository";

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId)
    throw AppError.validation("Cannot block yourself");

  // Find an existing match before blocking — block triggers match removal.
  const existingMatchId = await repo.findMatchBetween(blockerId, blockedId);

  await repo.blockUser(blockerId, blockedId);

  if (existingMatchId) {
    await matchingService.unmatch(blockerId, existingMatchId);
  }
}

export async function unblockUser(blockerId: string, blockedId: string) {
  await repo.unblockUser(blockerId, blockedId);
}

export async function getBlockedUsers(userId: string) {
  return await repo.getBlockedUsers(userId);
}

export async function createReport(
  reporterId: string,
  targetType: "account" | "pet" | "message",
  reason: "spam" | "inappropriate" | "harassment" | "fraud" | "other",
  targetAccountId: string | null,
  targetPetId: string | null,
  targetMessageId: string | null,
) {
  return await repo.createReport(
    reporterId,
    targetType,
    reason,
    targetAccountId,
    targetPetId,
    targetMessageId,
  );
}
