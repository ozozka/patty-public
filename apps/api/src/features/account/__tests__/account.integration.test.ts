import { db } from "@patty/api/db/client";
import {
  accounts,
  emailVerificationCodes,
  passwordResetCodes,
} from "@patty/api/db/schema";
import {
  createTestAccount,
  createVerifiedAccount,
  findAccountById,
} from "@patty/api/features/__tests__/fixtures/account";
import { createTestApp } from "@patty/api/features/__tests__/helpers/app";
import { generateAuthHeader } from "@patty/api/features/__tests__/helpers/auth";
import { describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";

const app = createTestApp();

const jsonHeaders = {
  "Content-Type": "application/json",
};

describe("POST /api/v1/register", () => {
  it("creates account and returns 201 with profile", async () => {
    const email = `test-${crypto.randomUUID()}@test.com`;
    const username = `testuser_${crypto.randomUUID().slice(0, 8)}`;

    const res = await app.request("/api/v1/register", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        email,
        username,
        password: "TestPassword123!",
        first_name: "Test",
        last_name: "User",
      }),
    });

    expect(res.status).toBe(201);
  });

  it("rejects duplicate email with 409", async () => {
    const email = `test-${crypto.randomUUID()}@test.com`;
    const username1 = `testuser_${crypto.randomUUID().slice(0, 8)}`;
    const username2 = `testuser_${crypto.randomUUID().slice(0, 8)}`;

    const res1 = await app.request("/api/v1/register", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        email,
        username: username1,
        password: "TestPassword123!",
        first_name: "Test",
        last_name: "User",
      }),
    });
    expect(res1.status).toBe(201);

    const res2 = await app.request("/api/v1/register", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        email,
        username: username2,
        password: "TestPassword123!",
        first_name: "Test",
        last_name: "User",
      }),
    });

    expect(res2.status).toBe(409);
    const body = await res2.json();
    expect(body.message).toContain("email");
  });

  it("rejects duplicate username with 409", async () => {
    const email1 = `test-${crypto.randomUUID()}@test.com`;
    const email2 = `test-${crypto.randomUUID()}@test.com`;
    const username = `testuser_${crypto.randomUUID().slice(0, 8)}`;

    const res1 = await app.request("/api/v1/register", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        email: email1,
        username,
        password: "TestPassword123!",
        first_name: "Test",
        last_name: "User",
      }),
    });
    expect(res1.status).toBe(201);

    const res2 = await app.request("/api/v1/register", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        email: email2,
        username,
        password: "TestPassword123!",
        first_name: "Test",
        last_name: "User",
      }),
    });

    expect(res2.status).toBe(409);
    const body = await res2.json();
    expect(body.message).toContain("username");
  });

  it("rejects invalid password with 400", async () => {
    const email = `test-${crypto.randomUUID()}@test.com`;
    const username = `testuser_${crypto.randomUUID().slice(0, 8)}`;

    const res = await app.request("/api/v1/register", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        email,
        username,
        password: "weak",
        first_name: "Test",
        last_name: "User",
      }),
    });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/login", () => {
  it("returns 200 with token for valid email credentials", async () => {
    const { email } = await createTestAccount();

    const res = await app.request("/api/v1/login", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        identifier: email,
        password: "TestPassword123!",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBeDefined();
    expect(body.status).toBe("unverified");
  });

  it("returns 200 with token for valid username credentials", async () => {
    const { email } = await createTestAccount();

    const res = await app.request("/api/v1/login", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        identifier: email,
        password: "TestPassword123!",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBeDefined();
  });

  it("returns 401 for wrong password", async () => {
    const { email } = await createTestAccount();

    const res = await app.request("/api/v1/login", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        identifier: email,
        password: "WrongPassword123!",
      }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toContain("Invalid credentials");
  });

  it("returns 401 for non-existent account", async () => {
    const res = await app.request("/api/v1/login", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        identifier: `nonexistent-${crypto.randomUUID()}@test.com`,
        password: "TestPassword123!",
      }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toContain("Invalid credentials");
  });

  it("returns 200 with tokens for soft-deleted account", async () => {
    const { email, id } = await createVerifiedAccount();

    await db
      .update(accounts)
      .set({ deletedAt: new Date() })
      .where(eq(accounts.id, id));

    const res = await app.request("/api/v1/login", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        identifier: email,
        password: "TestPassword123!",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBeDefined();
    expect(body.refresh_token).toBeDefined();
  });
});

describe("POST /api/v1/auth/verify-email", () => {
  it("verifies email with valid code and returns 200", async () => {
    const { id } = await createTestAccount();

    const code = "123456";
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.insert(emailVerificationCodes).values({
      accountId: id,
      code,
      expiresAt,
      attempts: 0,
      dailyCount: 1,
      lastDailyResetAt: new Date(),
      lastSentAt: new Date(),
      lastIp: "127.0.0.1",
    });

    const authHeader = await generateAuthHeader(id);

    const res = await app.request("/api/v1/auth/verify-email", {
      method: "POST",
      headers: { ...authHeader, ...jsonHeaders },
      body: JSON.stringify({ code }),
    });

    expect(res.status).toBe(200);

    const account = await findAccountById(id);
    expect(account?.status).toBe("verified");
  });

  it("returns 422 for expired code", async () => {
    const { id } = await createTestAccount();

    const code = "123456";
    const expiresAt = new Date(Date.now() - 1000);

    await db.insert(emailVerificationCodes).values({
      accountId: id,
      code,
      expiresAt,
      attempts: 0,
      dailyCount: 1,
      lastDailyResetAt: new Date(),
      lastSentAt: new Date(),
      lastIp: "127.0.0.1",
    });

    const authHeader = await generateAuthHeader(id);

    const res = await app.request("/api/v1/auth/verify-email", {
      method: "POST",
      headers: { ...authHeader, ...jsonHeaders },
      body: JSON.stringify({ code }),
    });

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.message).toContain("expired");
  });

  it("returns 422 for invalid code", async () => {
    const { id } = await createTestAccount();

    const code = "123456";
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.insert(emailVerificationCodes).values({
      accountId: id,
      code,
      expiresAt,
      attempts: 0,
      dailyCount: 1,
      lastDailyResetAt: new Date(),
      lastSentAt: new Date(),
      lastIp: "127.0.0.1",
    });

    const authHeader = await generateAuthHeader(id);

    const res = await app.request("/api/v1/auth/verify-email", {
      method: "POST",
      headers: { ...authHeader, ...jsonHeaders },
      body: JSON.stringify({ code: "000000" }),
    });

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.message).toContain("Invalid");
  });
});

describe("POST /api/v1/auth/resend-verification", () => {
  it("resends verification email", async () => {
    const { id } = await createTestAccount();

    const authHeader = await generateAuthHeader(id);

    const res = await app.request("/api/v1/auth/resend-verification", {
      method: "POST",
      headers: { ...authHeader, ...jsonHeaders },
    });

    expect(res.status).toBe(200);
  });
});

describe("POST /api/v1/auth/forgot-password", () => {
  it("returns 200 even for non-existent email (security)", async () => {
    const res = await app.request("/api/v1/auth/forgot-password", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        email: "nonexistent@test.com",
      }),
    });

    expect(res.status).toBe(200);
  });
});

describe("POST /api/v1/auth/reset-password", () => {
  it("resets password with valid code", async () => {
    const { email, id } = await createTestAccount();

    const code = "123456";
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.insert(passwordResetCodes).values({
      accountId: id,
      code,
      expiresAt,
      attempts: 0,
      dailyCount: 1,
      lastDailyResetAt: new Date(),
      lastSentAt: new Date(),
      lastIp: "127.0.0.1",
    });

    const res = await app.request("/api/v1/auth/reset-password", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        email,
        code,
        new_password: "NewPassword456!",
      }),
    });

    expect(res.status).toBe(200);

    const loginRes = await app.request("/api/v1/login", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        identifier: email,
        password: "NewPassword456!",
      }),
    });

    expect(loginRes.status).toBe(200);
  });

  it("returns 422 for expired code", async () => {
    const { email, id } = await createTestAccount();

    const code = "123456";
    const expiresAt = new Date(Date.now() - 1000);

    await db.insert(passwordResetCodes).values({
      accountId: id,
      code,
      expiresAt,
      attempts: 0,
      dailyCount: 1,
      lastDailyResetAt: new Date(),
      lastSentAt: new Date(),
      lastIp: "127.0.0.1",
    });

    const res = await app.request("/api/v1/auth/reset-password", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        email,
        code,
        new_password: "NewPassword456!",
      }),
    });

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.message).toContain("expired");
  });

  it("returns 422 for invalid code", async () => {
    const { email, id } = await createTestAccount();

    const code = "123456";
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.insert(passwordResetCodes).values({
      accountId: id,
      code,
      expiresAt,
      attempts: 0,
      dailyCount: 1,
      lastDailyResetAt: new Date(),
      lastSentAt: new Date(),
      lastIp: "127.0.0.1",
    });

    const res = await app.request("/api/v1/auth/reset-password", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        email,
        code: "000000",
        new_password: "NewPassword456!",
      }),
    });

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.message).toContain("Invalid");
  });
});

describe("PATCH /api/v1/user", () => {
  it("updates user profile successfully", async () => {
    const { id } = await createTestAccount();
    const authHeader = await generateAuthHeader(id);

    const res = await app.request("/api/v1/user", {
      method: "PATCH",
      headers: { ...authHeader, ...jsonHeaders },
      body: JSON.stringify({
        first_name: "Updated",
        last_name: "Name",
        bio: "New bio",
      }),
    });

    expect(res.status).toBe(204);

    const account = await findAccountById(id);
    expect(account?.firstName).toBe("Updated");
    expect(account?.lastName).toBe("Name");
    expect(account?.bio).toBe("New bio");
  });

  it("changing phone number resets phone_verified to false", async () => {
    const { id } = await createTestAccount();
    const phoneA = `+90555${String(Math.floor(Math.random() * 10000000)).padStart(7, "0")}`;
    const phoneB = `+90555${String(Math.floor(Math.random() * 10000000)).padStart(7, "0")}`;

    await db
      .update(accounts)
      .set({ phoneNumber: phoneA, phoneVerified: true })
      .where(eq(accounts.id, id));

    const authHeader = await generateAuthHeader(id);

    const res = await app.request("/api/v1/user", {
      method: "PATCH",
      headers: { ...authHeader, ...jsonHeaders },
      body: JSON.stringify({
        phone_number: phoneB,
      }),
    });

    expect(res.status).toBe(204);

    const account = await findAccountById(id);
    expect(account?.phoneNumber).toBe(phoneB);
    expect(account?.phoneVerified).toBe(false);
  });
});

describe("POST /api/v1/user/password", () => {
  it("changes password with correct current password", async () => {
    const { id, email } = await createTestAccount();
    const authHeader = await generateAuthHeader(id);

    const res = await app.request("/api/v1/user/password", {
      method: "POST",
      headers: { ...authHeader, ...jsonHeaders },
      body: JSON.stringify({
        current_password: "TestPassword123!",
        new_password: "NewPassword456!",
      }),
    });

    expect(res.status).toBe(200);

    const loginRes = await app.request("/api/v1/login", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        identifier: email,
        password: "NewPassword456!",
      }),
    });

    expect(loginRes.status).toBe(200);
  });

  it("returns 401 for wrong current password", async () => {
    const { id } = await createTestAccount();
    const authHeader = await generateAuthHeader(id);

    const res = await app.request("/api/v1/user/password", {
      method: "POST",
      headers: { ...authHeader, ...jsonHeaders },
      body: JSON.stringify({
        current_password: "WrongPassword123!",
        new_password: "NewPassword456!",
      }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toContain("incorrect");
  });
});

describe("DELETE /api/v1/user", () => {
  it("soft-deletes account", async () => {
    const { id } = await createTestAccount();
    const authHeader = await generateAuthHeader(id);

    const res = await app.request("/api/v1/user", {
      method: "DELETE",
      headers: authHeader,
    });

    expect(res.status).toBe(204);

    const account = await findAccountById(id);
    expect(account?.deletedAt).toBeDefined();
  });
});

describe("POST /api/v1/user/restore", () => {
  it("restores soft-deleted account", async () => {
    const { id } = await createTestAccount();

    await db
      .update(accounts)
      .set({ deletedAt: new Date() })
      .where(eq(accounts.id, id));

    const authHeader = await generateAuthHeader(id);

    const res = await app.request("/api/v1/user/restore", {
      method: "POST",
      headers: { ...authHeader, ...jsonHeaders },
    });

    expect(res.status).toBe(200);

    const account = await findAccountById(id);
    expect(account?.deletedAt).toBeNull();
  });

  it("rejects restore if 30 days have passed", async () => {
    const { id } = await createTestAccount();

    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    await db
      .update(accounts)
      .set({ deletedAt: thirtyOneDaysAgo })
      .where(eq(accounts.id, id));

    const authHeader = await generateAuthHeader(id);

    const res = await app.request("/api/v1/user/restore", {
      method: "POST",
      headers: { ...authHeader, ...jsonHeaders },
    });

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.message).toContain("expired");
  });

  it("allows restore within 30 days", async () => {
    const { id } = await createTestAccount();

    const twentyNineDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
    await db
      .update(accounts)
      .set({ deletedAt: twentyNineDaysAgo })
      .where(eq(accounts.id, id));

    const authHeader = await generateAuthHeader(id);

    const res = await app.request("/api/v1/user/restore", {
      method: "POST",
      headers: { ...authHeader, ...jsonHeaders },
    });

    expect(res.status).toBe(200);
  });
});

describe("GET /api/v1/profile", () => {
  it("returns own profile with pets", async () => {
    const { id } = await createTestAccount();
    const authHeader = await generateAuthHeader(id);

    const res = await app.request("/api/v1/profile", {
      method: "GET",
      headers: authHeader,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.email).toBeDefined();
    expect(body.pets).toBeDefined();
    expect(Array.isArray(body.pets)).toBe(true);
  });
});

describe("GET /api/v1/users/:id", () => {
  it("returns other user profile with phone hidden", async () => {
    const { id: viewerId } = await createTestAccount();
    const { id: targetId } = await createTestAccount({
      phoneNumber: crypto.randomUUID().replace(/-/g, "").slice(0, 10),
      phoneVerified: true,
    });

    const authHeader = await generateAuthHeader(viewerId);

    const res = await app.request(`/api/v1/users/${targetId}`, {
      method: "GET",
      headers: authHeader,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.phone_number).toBeNull();
    expect(body.phone_verified).toBeDefined();
  });

  it("returns full data for own profile", async () => {
    const { id } = await createTestAccount({
      phoneNumber: crypto.randomUUID().replace(/-/g, "").slice(0, 10),
      phoneVerified: true,
    });
    const created = await findAccountById(id);
    const authHeader = await generateAuthHeader(id);

    const res = await app.request(`/api/v1/users/${id}`, {
      method: "GET",
      headers: authHeader,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.phone_number).toBe(created?.phoneNumber);
  });
});

describe("PATCH /api/v1/profile/location", () => {
  it("updates location coordinates", async () => {
    const { id } = await createTestAccount();
    const authHeader = await generateAuthHeader(id);

    const res = await app.request("/api/v1/profile/location", {
      method: "PATCH",
      headers: { ...authHeader, ...jsonHeaders },
      body: JSON.stringify({
        latitude: 41.0082,
        longitude: 28.9784,
      }),
    });

    expect(res.status).toBe(200);

    const account = await findAccountById(id);
    expect(account?.latitude).toBe(41.0082);
    expect(account?.longitude).toBe(28.9784);
  });
});
