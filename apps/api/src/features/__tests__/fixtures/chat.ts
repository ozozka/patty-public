import { db } from "@patty/api/db/client";
import { matches, messages } from "@patty/api/db/schema/matches";

/**
 * Creates a test match between two users.
 * Automatically orders user IDs to ensure consistent match ID generation.
 */
export async function createTestMatch(
  userAId: string,
  userBId: string,
): Promise<string> {
  const [lower, higher] =
    userAId < userBId ? [userAId, userBId] : [userBId, userAId];

  const [match] = await db
    .insert(matches)
    .values({
      id: crypto.randomUUID(),
      userOneId: lower,
      userTwoId: higher,
    })
    .returning();

  if (!match) throw new Error("Failed to create match");

  return match.id;
}

/**
 * Creates a test message in a match.
 */
export async function createTestMessage(
  matchId: string,
  senderId: string,
  content: string,
  messageType: "text" | "image" | "location" = "text",
): Promise<string> {
  const [message] = await db
    .insert(messages)
    .values({
      id: crypto.randomUUID(),
      matchId,
      senderId,
      content,
      messageType,
      isRead: false,
    })
    .returning();

  if (!message) throw new Error("Failed to create message");

  return message.id;
}

/**
 * Creates multiple test messages in a match.
 */
export async function createTestMessages(
  matchId: string,
  senderId: string,
  count: number,
): Promise<string[]> {
  const messageIds: string[] = [];

  for (let i = 0; i < count; i++) {
    const id = await createTestMessage(matchId, senderId, `Message ${i + 1}`);
    messageIds.push(id);
  }

  return messageIds;
}
