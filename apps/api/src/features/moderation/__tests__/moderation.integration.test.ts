import { db } from "@patty/api/db/client";
import { matches, messages } from "@patty/api/db/schema/matches";
import { createVerifiedAccount } from "@patty/api/features/__tests__/fixtures/account";
import { createTestPet } from "@patty/api/features/__tests__/fixtures/pet";
import { generateAuthHeader } from "@patty/api/features/__tests__/helpers/auth";
import { app } from "@patty/api/index";
import { beforeEach, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";

describe("Moderation API", () => {
  let userA: { id: string; email: string };
  let userB: { id: string; email: string };
  let userC: { id: string; email: string };
  let authHeaderA: Record<string, string>;
  let _authHeaderB: Record<string, string>;

  beforeEach(async () => {
    userA = await createVerifiedAccount();
    userB = await createVerifiedAccount();
    userC = await createVerifiedAccount();

    authHeaderA = await generateAuthHeader(userA.id);
    _authHeaderB = await generateAuthHeader(userB.id);
  });

  describe("GET /api/v1/users/blocked", () => {
    it("returns empty list when no users are blocked", async () => {
      const res = await app.request("/api/v1/users/blocked", {
        method: "GET",
        headers: authHeaderA,
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual([]);
    });

    it("returns list of blocked users", async () => {
      await app.request(`/api/v1/users/${userB.id}/block`, {
        method: "POST",
        headers: authHeaderA,
      });

      const res = await app.request("/api/v1/users/blocked", {
        method: "GET",
        headers: authHeaderA,
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(1);
      expect(body[0].id).toBe(userB.id);
    });

    it("returns multiple blocked users", async () => {
      await app.request(`/api/v1/users/${userB.id}/block`, {
        method: "POST",
        headers: authHeaderA,
      });
      await app.request(`/api/v1/users/${userC.id}/block`, {
        method: "POST",
        headers: authHeaderA,
      });

      const res = await app.request("/api/v1/users/blocked", {
        method: "GET",
        headers: authHeaderA,
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.length).toBe(2);
    });
  });

  describe("POST /api/v1/users/:user_id/block", () => {
    it("blocks another user successfully", async () => {
      const res = await app.request(`/api/v1/users/${userB.id}/block`, {
        method: "POST",
        headers: authHeaderA,
      });

      expect(res.status).toBe(204);

      const blockedListRes = await app.request("/api/v1/users/blocked", {
        method: "GET",
        headers: authHeaderA,
      });
      const blockedList = await blockedListRes.json();
      expect(blockedList.length).toBe(1);
      expect(blockedList[0].id).toBe(userB.id);
    });

    it("returns 422 when trying to block self (validation error)", async () => {
      const res = await app.request(`/api/v1/users/${userA.id}/block`, {
        method: "POST",
        headers: authHeaderA,
      });

      expect(res.status).toBe(422);
    });

    it("removes existing match when blocking", async () => {
      const matchId = crypto.randomUUID();
      const [u1, u2] =
        userA.id < userB.id ? [userA.id, userB.id] : [userB.id, userA.id];

      await db.insert(matches).values({
        id: matchId,
        userOneId: u1,
        userTwoId: u2,
      });

      const blockRes = await app.request(`/api/v1/users/${userB.id}/block`, {
        method: "POST",
        headers: authHeaderA,
      });
      expect(blockRes.status).toBe(204);

      const [match] = await db
        .select()
        .from(matches)
        .where(eq(matches.id, matchId));
      expect(match).toBeDefined();
      expect(match?.deletedAt).not.toBeNull();
    });

    it("is idempotent - blocking already blocked user succeeds", async () => {
      await app.request(`/api/v1/users/${userB.id}/block`, {
        method: "POST",
        headers: authHeaderA,
      });

      const res = await app.request(`/api/v1/users/${userB.id}/block`, {
        method: "POST",
        headers: authHeaderA,
      });

      expect(res.status).toBe(204);
    });
  });

  describe("DELETE /api/v1/users/:user_id/block", () => {
    it("unblocks user successfully", async () => {
      await app.request(`/api/v1/users/${userB.id}/block`, {
        method: "POST",
        headers: authHeaderA,
      });

      const res = await app.request(`/api/v1/users/${userB.id}/block`, {
        method: "DELETE",
        headers: authHeaderA,
      });

      expect(res.status).toBe(204);

      const blockedListRes = await app.request("/api/v1/users/blocked", {
        method: "GET",
        headers: authHeaderA,
      });
      const blockedList = await blockedListRes.json();
      expect(blockedList.length).toBe(0);
    });

    it("is idempotent - unblocking non-blocked user succeeds", async () => {
      const res = await app.request(`/api/v1/users/${userB.id}/block`, {
        method: "DELETE",
        headers: authHeaderA,
      });

      expect(res.status).toBe(204);
    });
  });

  describe("POST /api/v1/reports", () => {
    it("creates report for account", async () => {
      const res = await app.request("/api/v1/reports", {
        method: "POST",
        headers: {
          ...authHeaderA,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target_type: "account",
          reason: "spam",
          target_account_id: userB.id,
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.id).toBeDefined();
    });

    it("creates report for pet", async () => {
      const pet = await createTestPet(userB.id);

      const res = await app.request("/api/v1/reports", {
        method: "POST",
        headers: {
          ...authHeaderA,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target_type: "pet",
          reason: "inappropriate",
          target_pet_id: pet.id,
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.id).toBeDefined();
    });

    it("creates report for message", async () => {
      const matchId = crypto.randomUUID();
      const [u1, u2] =
        userA.id < userB.id ? [userA.id, userB.id] : [userB.id, userA.id];

      await db.insert(matches).values({
        id: matchId,
        userOneId: u1,
        userTwoId: u2,
      });

      const [message] = await db
        .insert(messages)
        .values({
          matchId,
          senderId: userB.id,
          content: "Test message",
          messageType: "text",
        })
        .returning({ id: messages.id });

      const res = await app.request("/api/v1/reports", {
        method: "POST",
        headers: {
          ...authHeaderA,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target_type: "message",
          reason: "harassment",
          target_message_id: message?.id,
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.id).toBeDefined();
    });

    it("creates report with all reason types", async () => {
      const reasons = ["spam", "inappropriate", "harassment", "fraud", "other"];

      for (const reason of reasons) {
        const res = await app.request("/api/v1/reports", {
          method: "POST",
          headers: {
            ...authHeaderA,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            target_type: "account",
            reason,
            target_account_id: userB.id,
          }),
        });

        expect(res.status).toBe(201);
      }
    });

    it("requires authentication", async () => {
      const res = await app.request("/api/v1/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target_type: "account",
          reason: "spam",
          target_account_id: userB.id,
        }),
      });

      expect(res.status).toBe(401);
    });

    it("allows unverified users to report (verified middleware not applied)", async () => {
      const unverifiedUser = await createVerifiedAccount({
        status: "unverified",
      });
      const authHeader = await generateAuthHeader(unverifiedUser.id);

      const res = await app.request("/api/v1/reports", {
        method: "POST",
        headers: {
          ...authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target_type: "account",
          reason: "spam",
          target_account_id: userB.id,
        }),
      });

      expect(res.status).toBe(201);
    });
  });
});
