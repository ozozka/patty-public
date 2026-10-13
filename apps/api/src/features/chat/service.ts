import { AppError } from "@patty/api/lib/errors";
import { eventBus } from "@patty/api/lib/events";
import { wsManager } from "@patty/api/ws/manager";

import * as repo from "./repository";

export async function getMessages(
  matchId: string,
  userId: string,
  limit: number,
  cursor: string | null,
) {
  const isParticipant = await repo.isMatchParticipant(matchId, userId);
  if (!isParticipant) throw AppError.forbidden();

  const messages = await repo.getMessages(matchId, limit, cursor);

  // Batch-fetch replied-to messages for thread context.
  const replyIds = messages
    .map((m) => m.reply_to_id)
    .filter((id): id is string => id !== null);
  const repliedMap = new Map<string, (typeof messages)[number]>();

  if (replyIds.length > 0) {
    const replied = await repo.getMessagesByIds(replyIds);
    for (const m of replied) {
      repliedMap.set(m.id, m);
    }
  }

  return messages.map((m) => ({
    ...m,
    replied_to: m.reply_to_id ? (repliedMap.get(m.reply_to_id) ?? null) : null,
  }));
}

export async function sendMessage(
  matchId: string,
  userId: string,
  content: string,
  messageType: "text" | "image" | "location",
  replyToId: string | null,
  latitude: string | null,
  longitude: string | null,
) {
  const isParticipant = await repo.isMatchParticipant(matchId, userId);
  if (!isParticipant) throw AppError.forbidden();

  const message = await repo.createMessage(
    matchId,
    userId,
    content,
    messageType,
    replyToId,
    latitude,
    longitude,
  );

  // Update denormalized last-message snapshot on the match row.
  await repo.updateMatchLastMessage(message);

  // Determine recipient and emit events.
  const otherId = await repo.getOtherParticipant(matchId, userId);
  if (otherId) {
    eventBus.emit("message.sent", {
      matchId,
      senderId: userId,
      recipientId: otherId,
      messageId: message.id,
    });

    // Real-time delivery via WebSocket — shape must match wsMessageReceiveSchema.
    const wsEvent = {
      type: "MessageReceive",
      payload: {
        id: message.id,
        match_id: message.match_id,
        sender_id: message.sender_id,
        content: message.content,
        message_type: message.message_type,
        is_read: message.is_read,
        reply_to_id: message.reply_to_id,
        latitude: message.latitude,
        longitude: message.longitude,
        location_name: message.location_name,
        metadata: {},
        created_at: new Date(message.created_at).toISOString(),
      },
    };
    wsManager.send(userId, wsEvent);
    wsManager.send(otherId, wsEvent);
  }

  return message;
}

export async function markAsRead(
  matchId: string,
  userId: string,
  lastReadMessageId: string,
) {
  const isParticipant = await repo.isMatchParticipant(matchId, userId);
  if (!isParticipant) throw AppError.forbidden();

  await repo.markAsReadUpTo(matchId, lastReadMessageId);

  // Notify the sender that their messages have been read.
  const otherId = await repo.getOtherParticipant(matchId, userId);
  if (otherId) {
    // Shape must match wsReadReceiptRelaySchema.
    wsManager.send(otherId, {
      type: "ReadReceiptRelay",
      payload: {
        match_id: matchId,
        user_id: userId,
        last_read_message_id: lastReadMessageId,
      },
    });
  }
}

export async function getOtherParticipant(
  matchId: string,
  userId: string,
): Promise<string | null> {
  return repo.getOtherParticipant(matchId, userId);
}
