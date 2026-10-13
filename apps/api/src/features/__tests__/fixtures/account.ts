import { db } from "@patty/api/db/client";
import type { accountStatusEnum } from "@patty/api/db/schema/accounts";
import { accounts } from "@patty/api/db/schema/accounts";
import { hashPassword } from "@patty/api/lib/password";
import { eq, sql } from "drizzle-orm";

export interface TestAccountOverrides {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  status?: (typeof accountStatusEnum.enumValues)[number];
  bio?: string | null;
  phoneNumber?: string | null;
  phoneVerified?: boolean;
}

export const DEFAULT_PASSWORD = "TestPassword123!";

// Cached once per test process. Argon2id at the configured cost takes ~500ms;
// reusing one hash across all fixture calls saves 20-30 s on a full test run.
let _defaultPasswordHash: string | undefined;
async function getDefaultPasswordHash(): Promise<string> {
  _defaultPasswordHash ??= await hashPassword(DEFAULT_PASSWORD);
  return _defaultPasswordHash;
}

export async function createTestAccount(
  overrides?: TestAccountOverrides,
): Promise<{ id: string; email: string }> {
  const uuid = crypto.randomUUID();
  const email = overrides?.email ?? `test-${uuid}@test.com`;
  const username = overrides?.username ?? `testuser_${uuid.slice(0, 8)}`;
  const customPassword = overrides?.password;
  const passwordHash =
    customPassword !== undefined
      ? await hashPassword(customPassword)
      : await getDefaultPasswordHash();

  await db.execute(sql`
    INSERT INTO accounts (
      id, username, email, first_name, last_name, password,
      status, bio, phone_number, phone_verified,
      is_online, last_seen_at, metadata
    ) VALUES (
      ${uuid}, ${username}, ${email},
      ${overrides?.firstName ?? "Test"}, ${overrides?.lastName ?? "User"},
      ${passwordHash},
      ${overrides?.status ?? "unverified"}, ${overrides?.bio ?? null},
      ${overrides?.phoneNumber ?? null}, ${overrides?.phoneVerified ?? false},
      FALSE, NOW(), '{}'
    )
  `);

  return { id: uuid, email };
}

export async function createVerifiedAccount(
  overrides?: TestAccountOverrides,
): Promise<{ id: string; email: string }> {
  return createTestAccount({ ...overrides, status: "verified" });
}

export async function findAccountById(id: string) {
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, id))
    .limit(1);

  if (!account) {
    return null;
  }

  return {
    id: account.id,
    email: account.email,
    username: account.username,
    firstName: account.firstName,
    lastName: account.lastName,
    bio: account.bio,
    homeLocationId: account.homeLocationId,
    latitude: account.latitude,
    longitude: account.longitude,
    language: account.language,
    theme: account.theme,
    profilePictureUrl: account.profilePictureUrl,
    phoneNumber: account.phoneNumber,
    phoneVerified: account.phoneVerified,
    sharePhoneWithMatches: account.sharePhoneWithMatches,
    isOnline: account.isOnline,
    lastSeenAt: account.lastSeenAt,
    status: account.status,
    locationPrecision: account.locationPrecision,
    deletedAt: account.deletedAt,
    createdAt: account.createdAt,
  };
}

export async function deleteTestAccount(id: string): Promise<void> {
  await db.delete(accounts).where(eq(accounts.id, id));
}

export interface AccountLocationOverrides {
  latitude: number;
  longitude: number;
  homeLocationId?: number;
}

export async function setAccountLocation(
  accountId: string,
  location: AccountLocationOverrides,
): Promise<void> {
  await db.execute(sql`
    UPDATE accounts 
    SET 
      latitude = ${location.latitude},
      longitude = ${location.longitude},
      location = ST_SetSRID(ST_MakePoint(${location.longitude}, ${location.latitude}), 4326)::geography,
      home_location_id = ${location.homeLocationId ?? null}::integer
    WHERE id = ${accountId}::uuid
  `);
}
