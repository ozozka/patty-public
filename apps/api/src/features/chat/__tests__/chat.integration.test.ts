import { db } from "@patty/api/db/client";
import { matches, messages } from "@patty/api/db/schema/matches";
import { createVerifiedAccount } from "@patty/api/features/__tests__/fixtures/account";
import { createTestPet } from "@patty/api/features/__tests__/fixtures/pet";
import { generateAuthHeader } from "@patty/api/features/__tests__/helpers/auth";
import { app } from "@patty/api/index";
import { beforeEach, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";

async function createMatchBetweenAccounts(
  userOneId: string,
  userTwoId: string,
): Promise<string> {
  const [lower, higher] =
    userOneId < userTwoId ? [userOneId, userTwoId] : [userTwoId, userOneId];

  const [match] = await db
    .insert(matches)
    .values({
      id: crypto.randomUUID(),
      userOneId: lower,
      userTwoId: higher,
    })
    .returning({ id: matches.id });

  if (!match) {
    throw new Error("Failed to create match between accounts");
  }

  return match.id;
}

async function createMessage(
  matchId: string,
  senderId: string,
  content: string,
  messageType: "text" | "image" | "location" = "text",
  replyToId: string | null = null,
) {
  const [message] = await db
    .insert(messages)
    .values({
      id: crypto.randomUUID(),
      matchId,
      senderId,
      content,
      messageType,
      replyToId,
    })
    .returning({
      id: messages.id,
      matchId: messages.matchId,
      senderId: messages.senderId,
      content: messages.content,
      messageType: messages.messageType,
      isRead: messages.isRead,
      replyToId: messages.replyToId,
      createdAt: messages.createdAt,
    });

  if (!message) {
    throw new Error("Failed to create message");
  }

  return message;
}

describe("Chat API", () => {
  let account1: { id: string; email: string };
  let account2: { id: string; email: string };
  let _pet1: { id: string; accountId: string };
  let _pet2: { id: string; accountId: string };
  let matchId: string;
  let authHeader1: Record<string, string>;
  let authHeader2: Record<string, string>;

  beforeEach(async () => {
    account1 = await createVerifiedAccount();
    account2 = await createVerifiedAccount();
    _pet1 = await createTestPet(account1.id, { name: "Pet1" });
    _pet2 = await createTestPet(account2.id, { name: "Pet2" });

    matchId = await createMatchBetweenAccounts(account1.id, account2.id);

    authHeader1 = await generateAuthHeader(account1.id);
    authHeader2 = await generateAuthHeader(account2.id);
  });

  describe("GET /api/v1/:match_id/messages", () => {
    it("returns messages for match participant", async () => {
      await createMessage(matchId, account1.id, "Hello!");
      const res = await app.request(`/api/v1/matches/${matchId}/messages`, {
        headers: authHeader1,
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      expect(body[0]?.content).toBe("Hello!");
    });

    it("returns 403 for non-participant", async () => {
      const otherAccount = await createVerifiedAccount();
      const otherAuth = await generateAuthHeader(otherAccount.id);

      const res = await app.request(`/api/v1/matches/${matchId}/messages`, {
        headers: otherAuth,
      });

      expect(res.status).toBe(403);
    });

    it("supports cursor-based pagination", async () => {
      await createMessage(matchId, account1.id, "Message 1");
      const msg2 = await createMessage(matchId, account1.id, "Message 2");
      await createMessage(matchId, account1.id, "Message 3");

      if (!msg2.createdAt) {
        throw new Error("Message createdAt is null");
      }

      const cursor = msg2.createdAt.toISOString();

      const res = await app.request(
        `/api/v1/matches/${matchId}/messages?limit=2&cursor=${encodeURIComponent(cursor)}`,
        { headers: authHeader1 },
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeLessThanOrEqual(2);
    });

    it("includes replied_to messages for thread context", async () => {
      const replyToMsg = await createMessage(
        matchId,
        account1.id,
        "Original message",
      );
      await createMessage(
        matchId,
        account2.id,
        "Reply message",
        "text",
        replyToMsg.id,
      );

      const res = await app.request(`/api/v1/matches/${matchId}/messages`, {
        headers: authHeader1,
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      const replyMessage = body.find(
        (m: { content: string }) => m.content === "Reply message",
      );
      expect(replyMessage).toBeDefined();
      expect(replyMessage.replied_to).toBeDefined();
      expect(replyMessage.replied_to?.content).toBe("Original message");
    });
  });

  describe("POST /api/v1/:match_id/messages", () => {
    it("sends text message as participant", async () => {
      const res = await app.request(`/api/v1/matches/${matchId}/messages`, {
        method: "POST",
        headers: { ...authHeader1, "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: matchId,
          content: "Hello there!",
          message_type: "text",
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.content).toBe("Hello there!");
      expect(body.message_type).toBe("text");
      expect(body.sender_id).toBe(account1.id);
    });

    it("sends image message as participant", async () => {
      const res = await app.request(`/api/v1/matches/${matchId}/messages`, {
        method: "POST",
        headers: { ...authHeader1, "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: matchId,
          content: "https://example.com/image.jpg",
          message_type: "image",
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.message_type).toBe("image");
      expect(body.content).toBe("https://example.com/image.jpg");
    });

    it("sends location message as participant", async () => {
      const res = await app.request(`/api/v1/matches/${matchId}/messages`, {
        method: "POST",
        headers: { ...authHeader1, "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: matchId,
          content: "Meeting spot",
          message_type: "location",
          latitude: 41.0082,
          longitude: 28.9784,
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.message_type).toBe("location");
      expect(body.latitude).toBeDefined();
      expect(body.longitude).toBeDefined();
    });

    it("returns 403 for non-participant", async () => {
      const otherAccount = await createVerifiedAccount();
      const otherAuth = await generateAuthHeader(otherAccount.id);

      const res = await app.request(`/api/v1/matches/${matchId}/messages`, {
        method: "POST",
        headers: { ...otherAuth, "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: matchId,
          content: "Hello!",
          message_type: "text",
        }),
      });

      expect(res.status).toBe(403);
    });

    it("updates last_message denormalized fields", async () => {
      const res = await app.request(`/api/v1/matches/${matchId}/messages`, {
        method: "POST",
        headers: { ...authHeader1, "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: matchId,
          content: "Test message for denorm",
          message_type: "text",
        }),
      });

      expect(res.status).toBe(201);

      const [match] = await db
        .select()
        .from(matches)
        .where(eq(matches.id, matchId));

      if (!match) {
        throw new Error("Match not found after message send");
      }

      expect(match.lastMessagePreview).toBe("Test message for denorm");
      expect(match.lastMessageType).toBe("text");
      expect(match.lastMessageSenderId).toBe(account1.id);
      expect(match.lastMessageAt).toBeDefined();
    });
  });

  describe("POST /api/v1/:match_id/messages/read", () => {
    it("marks messages as read for participant", async () => {
      const msg = await createMessage(matchId, account1.id, "Unread message");

      const res = await app.request(
        `/api/v1/matches/${matchId}/messages/read`,
        {
          method: "POST",
          headers: { ...authHeader2, "Content-Type": "application/json" },
          body: JSON.stringify({
            last_read_message_id: msg.id,
          }),
        },
      );

      expect(res.status).toBe(204);

      const [updatedMsg] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, msg.id));

      if (!updatedMsg) {
        throw new Error("Message not found after read update");
      }

      expect(updatedMsg.isRead).toBe(true);
    });

    it("returns 403 for non-participant", async () => {
      const otherAccount = await createVerifiedAccount();
      const otherAuth = await generateAuthHeader(otherAccount.id);

      const msg = await createMessage(matchId, account1.id, "Test");

      const res = await app.request(
        `/api/v1/matches/${matchId}/messages/read`,
        {
          method: "POST",
          headers: { ...otherAuth, "Content-Type": "application/json" },
          body: JSON.stringify({
            last_read_message_id: msg.id,
          }),
        },
      );

      expect(res.status).toBe(403);
    });

    it("batch marks all messages up to target as read", async () => {
      const msg1 = await createMessage(matchId, account1.id, "Message 1");
      const msg2 = await createMessage(matchId, account1.id, "Message 2");
      const msg3 = await createMessage(matchId, account1.id, "Message 3");

      const res = await app.request(
        `/api/v1/matches/${matchId}/messages/read`,
        {
          method: "POST",
          headers: { ...authHeader2, "Content-Type": "application/json" },
          body: JSON.stringify({
            last_read_message_id: msg2.id,
          }),
        },
      );

      expect(res.status).toBe(204);

      const updatedMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.matchId, matchId));

      const msg1Read = updatedMessages.find((m) => m.id === msg1.id);
      const msg2Read = updatedMessages.find((m) => m.id === msg2.id);
      const msg3Read = updatedMessages.find((m) => m.id === msg3.id);

      expect(msg1Read?.isRead).toBe(true);
      expect(msg2Read?.isRead).toBe(true);
      expect(msg3Read?.isRead).toBe(false);
    });
  });
});
