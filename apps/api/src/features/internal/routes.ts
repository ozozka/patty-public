import { db } from "@patty/api/db/client";
import {
  breeds,
  emailVerificationCodes,
  locations,
} from "@patty/api/db/schema";
import { env } from "@patty/api/env";
import { AppError } from "@patty/api/lib/errors";
import { hashPassword } from "@patty/api/lib/password";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

import * as accountRepo from "../account/repository";
import * as chatRepo from "../chat/repository";
import * as matchingRepo from "../matching/repository";
import * as petRepo from "../pet/repository";

const E2E_PARTNER_EMAIL = "test-partner@patty.app";
const E2E_REGISTER_EMAIL = "test-register@patty.app";
const E2E_BYPASS_CODE = "123456";

const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok" }));

async function createVerifiedAccount(
  email: string,
  username: string,
  firstName: string,
  lastName: string,
): Promise<string> {
  const hashedPassword = await hashPassword("Password123!");
  const accountId = crypto.randomUUID();

  // Create account FIRST, then verification code (FK constraint)
  await accountRepo.createAccount({
    id: accountId,
    email,
    username,
    password: hashedPassword,
    language: "en",
    theme: "system",
    firstName,
    lastName,
    phoneNumber: null,
    homeLocationId: null,
    latitude: null,
    longitude: null,
  });

  await db.insert(emailVerificationCodes).values({
    accountId,
    code: E2E_BYPASS_CODE,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    attempts: 0,
    dailyCount: 1,
    lastDailyResetAt: new Date(),
    lastSentAt: new Date(),
    lastIp: "127.0.0.1",
  });

  await accountRepo.verifyEmail(accountId);

  return accountId;
}

/**
 * INTERNAL USE ONLY: Resets data for the Maestro test accounts.
 * Protected by MAESTRO_SECRET header.
 * Disabled in production.
 */
app.post("/e2e-reset", async (c) => {
  if (env.NODE_ENV === "production") {
    return c.notFound();
  }

  const secret = c.req.header("X-Maestro-Secret");

  if (!secret || secret !== env.MAESTRO_SECRET) {
    throw AppError.unauthorized("Invalid internal secret");
  }

  const testEmail = env.E2E_TEST_EMAIL;

  await accountRepo.hardDeleteAccountByEmail(testEmail);
  await accountRepo.hardDeleteAccountByEmail(E2E_PARTNER_EMAIL);

  // Don't pre-create test-register@patty.app - let the registration flow create it fresh
  // This tests the full registration + verification flow
  await accountRepo
    .hardDeleteAccountByEmail(E2E_REGISTER_EMAIL)
    .catch(() => {});

  await createVerifiedAccount(testEmail, "maestro_test", "Maestro", "Tester");

  const partnerId = await createVerifiedAccount(
    E2E_PARTNER_EMAIL,
    "maestro_partner",
    "Maestro",
    "Partner",
  );

  // Seed partner with Ankara location and a pet so they appear as discovery candidates.
  // maestro_e2e registers with Ankara/Mamak, so partner must be in the same area.
  const [districtRow] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(eq(locations.level, "district"))
    .limit(1);

  const [breedRow] = await db.select({ id: breeds.id }).from(breeds).limit(1);

  if (districtRow && breedRow) {
    await accountRepo.updateAccount(partnerId, {
      homeLocationId: districtRow.id,
      latitude: 39.9417,
      longitude: 32.9011,
    });

    await petRepo.createPet({
      id: crypto.randomUUID(),
      accountId: partnerId,
      name: "Partner Pet",
      breedId: breedRow.id,
      birthDate: null,
      bio: null,
      gender: "male",
      matchingPreferences: ["male", "female"],
    });
  }

  // Note: test-register@patty.app is NOT pre-created.
  // The registration flow creates it fresh; the E2E bypass code works for any account.

  return c.json({
    success: true,
    message: `Accounts reset and seeded successfully`,
    personas: [
      { email: testEmail, username: "maestro_test", verified: true },
      { email: E2E_PARTNER_EMAIL, username: "maestro_partner", verified: true },
      {
        email: E2E_REGISTER_EMAIL,
        username: "maestro_register",
        verified: true,
      },
    ],
  });
});

/**
 * INTERNAL USE ONLY: Creates a match between two test accounts.
 * Protected by MAESTRO_SECRET header.
 * Disabled in production.
 */
app.post("/e2e-match", async (c) => {
  if (env.NODE_ENV === "production") {
    return c.notFound();
  }

  const secret = c.req.header("X-Maestro-Secret");
  if (!secret || secret !== env.MAESTRO_SECRET) {
    throw AppError.unauthorized("Invalid internal secret");
  }

  const { userOneEmail, userTwoEmail } = await c.req.json().catch(() => ({}));

  if (!userOneEmail || !userTwoEmail) {
    throw AppError.validation("userOneEmail and userTwoEmail are required");
  }

  const userOne = await accountRepo.findByEmail(userOneEmail);
  const userTwo = await accountRepo.findByEmail(userTwoEmail);

  if (!userOne || !userTwo) {
    throw AppError.notFound("One or both accounts not found");
  }

  const matchId = await matchingRepo.createMatch(userOne.id, userTwo.id);

  return c.json({ success: true, matchId });
});

/**
 * INTERNAL USE ONLY: Sends a message from one test account to another.
 * Protected by MAESTRO_SECRET header.
 * Disabled in production.
 */
app.post("/e2e-message", async (c) => {
  if (env.NODE_ENV === "production") {
    return c.notFound();
  }

  const secret = c.req.header("X-Maestro-Secret");
  if (!secret || secret !== env.MAESTRO_SECRET) {
    throw AppError.unauthorized("Invalid internal secret");
  }

  const { fromEmail, toEmail, content } = await c.req.json().catch(() => ({}));

  if (!fromEmail || !toEmail || !content) {
    throw AppError.validation("fromEmail, toEmail, and content are required");
  }

  const fromUser = await accountRepo.findByEmail(fromEmail);
  const toUser = await accountRepo.findByEmail(toEmail);

  if (!fromUser || !toUser) {
    throw AppError.notFound("One or both accounts not found");
  }

  const matchId = await matchingRepo.findExistingMatch(fromUser.id, toUser.id);
  if (!matchId) {
    throw AppError.notFound(
      "No match exists between these users. Create a match first using /e2e-match",
    );
  }

  const message = await chatRepo.createMessage(
    matchId,
    fromUser.id,
    content,
    "text",
    null,
    null,
    null,
  );

  return c.json({ success: true, messageId: message.id });
});

export { app as internalRouter };
