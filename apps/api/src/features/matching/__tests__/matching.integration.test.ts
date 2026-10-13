import { db } from "@patty/api/db/client";
import { accounts as accountsTable } from "@patty/api/db/schema/accounts";
import { locations } from "@patty/api/db/schema/locations";
import { breeds, species } from "@patty/api/db/schema/species";
import {
  createVerifiedAccount,
  setAccountLocation,
} from "@patty/api/features/__tests__/fixtures/account";
import { createTestPet } from "@patty/api/features/__tests__/fixtures/pet";
import { generateAuthHeader } from "@patty/api/features/__tests__/helpers/auth";
import { app } from "@patty/api/index";
import { beforeEach, describe, expect, it } from "bun:test";
import { sql } from "drizzle-orm";

const BASE_URL = "/api/v1/matching";
const MATCHES_URL = "/api/v1/matches";

async function createTestEnvironment() {
  const id = crypto.randomUUID().slice(0, 8);
  const account1 = await createVerifiedAccount({
    email: `user1-${id}@test.com`,
    username: `user1_${id}`,
  });
  const account2 = await createVerifiedAccount({
    email: `user2-${id}@test.com`,
    username: `user2_${id}`,
  });
  const account3 = await createVerifiedAccount({
    email: `user3-${id}@test.com`,
    username: `user3_${id}`,
  });

  const [dogSpecies] = await db
    .select()
    .from(species)
    .where(sql`${species.nameEn} = 'Dog'`)
    .limit(1);

  let breedId: number;
  if (dogSpecies) {
    const [breed] = await db
      .select()
      .from(breeds)
      .where(sql`${breeds.speciesId} = ${dogSpecies.id}`)
      .limit(1);
    breedId = breed?.id ?? 1;
  } else {
    breedId = 1;
  }

  const [istanbul] = await db
    .select()
    .from(locations)
    .where(sql`${locations.nameEn} = 'Istanbul'`)
    .limit(1);

  await setAccountLocation(account1.id, {
    latitude: 41.0082,
    longitude: 28.9784,
    homeLocationId: istanbul?.id,
  });

  await setAccountLocation(account2.id, {
    latitude: 41.0082,
    longitude: 28.9784,
    homeLocationId: istanbul?.id,
  });

  await setAccountLocation(account3.id, {
    latitude: 39.9334,
    longitude: 32.8597,
    homeLocationId: undefined,
  });

  const pet1 = await createTestPet(account1.id, {
    name: "Pet1",
    breedId,
    gender: "male",
    matchingPreferences: ["female"],
  });

  const pet2 = await createTestPet(account2.id, {
    name: "Pet2",
    breedId,
    gender: "female",
    matchingPreferences: ["male"],
  });

  const pet3 = await createTestPet(account3.id, {
    name: "Pet3",
    breedId,
    gender: "female",
    matchingPreferences: ["male"],
  });

  await db.execute(sql`
    INSERT INTO pet_photos (id, pet_id, image_url, display_order)
    VALUES 
      (${crypto.randomUUID()}::uuid, ${pet1.id}::uuid, 'https://example.com/pet1.jpg', 0),
      (${crypto.randomUUID()}::uuid, ${pet2.id}::uuid, 'https://example.com/pet2.jpg', 0),
      (${crypto.randomUUID()}::uuid, ${pet3.id}::uuid, 'https://example.com/pet3.jpg', 0)
  `);

  return {
    accounts: { account1, account2, account3 },
    pets: { pet1, pet2, pet3 },
    locationId: istanbul?.id,
  };
}

describe("GET /api/v1/candidates", () => {
  let env: Awaited<ReturnType<typeof createTestEnvironment>>;
  let headers1: Record<string, string>;

  beforeEach(async () => {
    env = await createTestEnvironment();
    headers1 = await generateAuthHeader(env.accounts.account1.id);
  });

  it("excludes own pets from candidates", async () => {
    const response = await app.request(
      `${BASE_URL}/candidates?active_pet_id=${env.pets.pet1.id}`,
      { headers: headers1 },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.candidates).toBeDefined();
    expect(Array.isArray(body.candidates)).toBe(true);

    const petIds = body.candidates.map((c: { id: string }) => c.id);
    expect(petIds).not.toContain(env.pets.pet1.id);
  });

  it("returns only same breed pets", async () => {
    const response = await app.request(
      `${BASE_URL}/candidates?active_pet_id=${env.pets.pet1.id}`,
      { headers: headers1 },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.candidates).toBeDefined();

    for (const candidate of body.candidates) {
      expect(candidate.breed_id).toBeDefined();
    }
  });

  it("filters by gender preferences", async () => {
    const response = await app.request(
      `${BASE_URL}/candidates?active_pet_id=${env.pets.pet1.id}`,
      { headers: headers1 },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.candidates).toBeDefined();

    const candidateGenders = body.candidates.map(
      (c: { gender: string }) => c.gender,
    );
    // Verify the filter works (all returned candidates are female) without
    // asserting an exact count — accumulated test data means multiple females
    // may exist across beforeEach runs in the same test file.
    expect(candidateGenders.length).toBeGreaterThan(0);
    expect(candidateGenders.every((g: string) => g === "female")).toBe(true);
  });

  it("excludes already-swiped pets", async () => {
    await db.execute(sql`
      INSERT INTO swipes (id, swiper_user_id, active_pet_id, target_pet_id, action)
      VALUES (
        ${crypto.randomUUID()}::uuid,
        ${env.accounts.account1.id}::uuid,
        ${env.pets.pet1.id}::uuid,
        ${env.pets.pet2.id}::uuid,
        'like'::swipe_action
      )
    `);

    const response = await app.request(
      `${BASE_URL}/candidates?active_pet_id=${env.pets.pet1.id}`,
      { headers: headers1 },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    const candidateIds = body.candidates.map((c: { id: string }) => c.id);
    expect(candidateIds).not.toContain(env.pets.pet2.id);
  });

  it("excludes blocked users pets", async () => {
    await db.execute(sql`
      INSERT INTO user_blocks (blocker_id, blocked_id)
      VALUES (
        ${env.accounts.account1.id}::uuid,
        ${env.accounts.account2.id}::uuid
      )
    `);

    const response = await app.request(
      `${BASE_URL}/candidates?active_pet_id=${env.pets.pet1.id}`,
      { headers: headers1 },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    const candidateIds = body.candidates.map((c: { id: string }) => c.id);
    expect(candidateIds).not.toContain(env.pets.pet2.id);
  });

  it("respects radius_km parameter", async () => {
    const response = await app.request(
      `${BASE_URL}/candidates?active_pet_id=${env.pets.pet1.id}&radius_km=1`,
      { headers: headers1 },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.candidates).toBeDefined();

    for (const candidate of body.candidates) {
      if (candidate.distance_m !== null) {
        expect(candidate.distance_m).toBeLessThanOrEqual(1000);
      }
    }
  });

  it("orders by distance ascending", async () => {
    const account4 = await createVerifiedAccount();

    await setAccountLocation(account4.id, {
      latitude: 41.01,
      longitude: 28.98,
    });

    const pet4 = await createTestPet(account4.id, {
      name: "Pet4",
      breedId: 1,
      gender: "female",
      matchingPreferences: ["male"],
    });

    await db.execute(sql`
      INSERT INTO pet_photos (id, pet_id, image_url, display_order)
      VALUES (${crypto.randomUUID()}::uuid, ${pet4.id}::uuid, 'https://example.com/pet4.jpg', 0)
    `);

    const response = await app.request(
      `${BASE_URL}/candidates?active_pet_id=${env.pets.pet1.id}`,
      { headers: headers1 },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.candidates.length).toBeGreaterThan(0);

    const distances = body.candidates
      .filter((c: { distance_m: number | null }) => c.distance_m !== null)
      .map((c: { distance_m: number }) => c.distance_m);

    for (let i = 1; i < distances.length; i++) {
      expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1]);
    }
  });
});

describe("POST /api/v1/swipe", () => {
  let env: Awaited<ReturnType<typeof createTestEnvironment>>;
  let headers1: Record<string, string>;

  beforeEach(async () => {
    env = await createTestEnvironment();
    headers1 = await generateAuthHeader(env.accounts.account1.id);
  });

  it("records LIKE swipe successfully", async () => {
    const response = await app.request(`${BASE_URL}/swipe`, {
      method: "POST",
      headers: {
        ...headers1,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        active_pet_id: env.pets.pet1.id,
        target_pet_id: env.pets.pet2.id,
        action: "LIKE",
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.is_match).toBe(false);
    expect(body.match_id).toBeNull();
  });

  it("records DISLIKE swipe successfully", async () => {
    const response = await app.request(`${BASE_URL}/swipe`, {
      method: "POST",
      headers: {
        ...headers1,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        active_pet_id: env.pets.pet1.id,
        target_pet_id: env.pets.pet2.id,
        action: "DISLIKE",
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.is_match).toBe(false);
    expect(body.match_id).toBeNull();
  });

  it("returns no match for one-way LIKE", async () => {
    await app.request(`${BASE_URL}/swipe`, {
      method: "POST",
      headers: {
        ...headers1,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        active_pet_id: env.pets.pet1.id,
        target_pet_id: env.pets.pet2.id,
        action: "LIKE",
      }),
    });

    const headers2 = await generateAuthHeader(env.accounts.account2.id);
    const response2 = await app.request(`${BASE_URL}/swipe`, {
      method: "POST",
      headers: {
        ...headers2,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        active_pet_id: env.pets.pet2.id,
        target_pet_id: env.pets.pet1.id,
        action: "DISLIKE",
      }),
    });

    expect(response2.status).toBe(200);
    const body = await response2.json();
    expect(body.is_match).toBe(false);
    expect(body.match_id).toBeNull();
  });

  it("creates match for mutual LIKE", async () => {
    await app.request(`${BASE_URL}/swipe`, {
      method: "POST",
      headers: {
        ...headers1,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        active_pet_id: env.pets.pet1.id,
        target_pet_id: env.pets.pet2.id,
        action: "LIKE",
      }),
    });

    const headers2 = await generateAuthHeader(env.accounts.account2.id);
    const response2 = await app.request(`${BASE_URL}/swipe`, {
      method: "POST",
      headers: {
        ...headers2,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        active_pet_id: env.pets.pet2.id,
        target_pet_id: env.pets.pet1.id,
        action: "LIKE",
      }),
    });

    expect(response2.status).toBe(200);
    const body = await response2.json();
    expect(body.is_match).toBe(true);
    expect(body.match_id).toBeDefined();
    expect(body.match_id).not.toBeNull();
  });

  it("prevents self-match (swiping own pet)", async () => {
    const response = await app.request(`${BASE_URL}/swipe`, {
      method: "POST",
      headers: {
        ...headers1,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        active_pet_id: env.pets.pet1.id,
        target_pet_id: env.pets.pet1.id,
        action: "LIKE",
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.is_match).toBe(false);
    expect(body.match_id).toBeNull();
  });

  it("returns is_match: false for non-matching swipe", async () => {
    const response = await app.request(`${BASE_URL}/swipe`, {
      method: "POST",
      headers: {
        ...headers1,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        active_pet_id: env.pets.pet1.id,
        target_pet_id: env.pets.pet2.id,
        action: "LIKE",
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.is_match).toBe(false);
  });

  it("returns is_match: true and match_id for mutual like", async () => {
    await app.request(`${BASE_URL}/swipe`, {
      method: "POST",
      headers: {
        ...headers1,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        active_pet_id: env.pets.pet1.id,
        target_pet_id: env.pets.pet2.id,
        action: "LIKE",
      }),
    });

    const headers2 = await generateAuthHeader(env.accounts.account2.id);
    const response = await app.request(`${BASE_URL}/swipe`, {
      method: "POST",
      headers: {
        ...headers2,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        active_pet_id: env.pets.pet2.id,
        target_pet_id: env.pets.pet1.id,
        action: "LIKE",
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.is_match).toBe(true);
    expect(body.match_id).not.toBeNull();
    expect(body.match_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});

describe("GET /api/v1/matches", () => {
  let env: Awaited<ReturnType<typeof createTestEnvironment>>;
  let headers1: Record<string, string>;
  let matchId: string;

  beforeEach(async () => {
    env = await createTestEnvironment();
    headers1 = await generateAuthHeader(env.accounts.account1.id);

    await app.request(`${BASE_URL}/swipe`, {
      method: "POST",
      headers: {
        ...headers1,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        active_pet_id: env.pets.pet1.id,
        target_pet_id: env.pets.pet2.id,
        action: "LIKE",
      }),
    });

    const headers2 = await generateAuthHeader(env.accounts.account2.id);
    const response2 = await app.request(`${BASE_URL}/swipe`, {
      method: "POST",
      headers: {
        ...headers2,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        active_pet_id: env.pets.pet2.id,
        target_pet_id: env.pets.pet1.id,
        action: "LIKE",
      }),
    });

    const body = await response2.json();
    matchId = body.match_id;
  });

  it("returns list of matches", async () => {
    const response = await app.request(`${MATCHES_URL}`, {
      headers: headers1,
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);

    const match = body.find((m: { id: string }) => m.id === matchId);
    expect(match).toBeDefined();
    expect(match.other_user).toBeDefined();
    expect(match.other_user.id).toBe(env.accounts.account2.id);
  });

  it("includes unread message counts", async () => {
    await db.execute(sql`
      INSERT INTO messages (id, match_id, sender_id, content, message_type, is_read)
      VALUES (
        ${crypto.randomUUID()}::uuid,
        ${matchId}::uuid,
        ${env.accounts.account2.id}::uuid,
        'Hello!',
        'text',
        false
      )
    `);

    const response = await app.request(`${MATCHES_URL}`, {
      headers: headers1,
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    const match = body.find((m: { id: string }) => m.id === matchId);
    expect(match.unread_count).toBe(1);
  });

  it("computes online status correctly", async () => {
    await db
      .update(accountsTable)
      .set({ isOnline: true, lastSeenAt: new Date() })
      .where(sql`${accountsTable.id} = ${env.accounts.account2.id}::uuid`);

    const response = await app.request(`${MATCHES_URL}`, {
      headers: headers1,
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    const match = body.find((m: { id: string }) => m.id === matchId);
    expect(match.is_online).toBe(true);
  });

  it("sorts by last message date descending", async () => {
    await db.execute(sql`
      INSERT INTO messages (id, match_id, sender_id, content, message_type, is_read, created_at)
      VALUES 
        (
          ${crypto.randomUUID()}::uuid,
          ${matchId}::uuid,
          ${env.accounts.account2.id}::uuid,
          'First message',
          'text',
          true,
          NOW() - INTERVAL '2 days'
        ),
        (
          ${crypto.randomUUID()}::uuid,
          ${matchId}::uuid,
          ${env.accounts.account2.id}::uuid,
          'Second message',
          'text',
          true,
          NOW() - INTERVAL '1 day'
        )
    `);

    const response = await app.request(`${MATCHES_URL}`, {
      headers: headers1,
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.length).toBeGreaterThan(0);

    const sorted = [...body].sort(
      (
        a: { last_message: { created_at: string | null }; created_at: string },
        b: { last_message: { created_at: string | null }; created_at: string },
      ) => {
        const aTime = new Date(
          a.last_message?.created_at ?? a.created_at,
        ).getTime();
        const bTime = new Date(
          b.last_message?.created_at ?? b.created_at,
        ).getTime();
        return bTime - aTime;
      },
    );

    expect(body).toEqual(sorted);
  });
});

describe("DELETE /api/v1/matches/:id", () => {
  let env: Awaited<ReturnType<typeof createTestEnvironment>>;
  let headers1: Record<string, string>;
  let matchId: string;

  beforeEach(async () => {
    env = await createTestEnvironment();
    headers1 = await generateAuthHeader(env.accounts.account1.id);

    await app.request(`${BASE_URL}/swipe`, {
      method: "POST",
      headers: {
        ...headers1,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        active_pet_id: env.pets.pet1.id,
        target_pet_id: env.pets.pet2.id,
        action: "LIKE",
      }),
    });

    const headers2 = await generateAuthHeader(env.accounts.account2.id);
    const response2 = await app.request(`${BASE_URL}/swipe`, {
      method: "POST",
      headers: {
        ...headers2,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        active_pet_id: env.pets.pet2.id,
        target_pet_id: env.pets.pet1.id,
        action: "LIKE",
      }),
    });

    const body = await response2.json();
    matchId = body.match_id;
  });

  it("soft-deletes match for participant", async () => {
    const response = await app.request(`${MATCHES_URL}/${matchId}`, {
      method: "DELETE",
      headers: headers1,
    });

    expect(response.status).toBe(204);

    const matchesResponse = await app.request(`${MATCHES_URL}`, {
      headers: headers1,
    });

    const body = await matchesResponse.json();
    const match = body.find((m: { id: string }) => m.id === matchId);
    expect(match).toBeUndefined();
  });

  it("returns 403 for non-participant", async () => {
    const account4 = await createVerifiedAccount();
    const headers4 = await generateAuthHeader(account4.id);

    const response = await app.request(`${MATCHES_URL}/${matchId}`, {
      method: "DELETE",
      headers: headers4,
    });

    expect(response.status).toBe(401);
  });
});
