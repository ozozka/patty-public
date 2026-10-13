import { db } from "@patty/api/db/client";
import { breeds, species } from "@patty/api/db/schema/species";
import { createVerifiedAccount } from "@patty/api/features/__tests__/fixtures/account";
import {
  createTestPet,
  createTestPetWithPhotos,
} from "@patty/api/features/__tests__/fixtures/pet";
import { generateAuthHeader } from "@patty/api/features/__tests__/helpers/auth";
import { app } from "@patty/api/index";
import { describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";

async function getTestBreedId(): Promise<number> {
  const [speciesRow] = await db
    .select()
    .from(species)
    .limit(1)
    .where(eq(species.nameEn, "Dog"));
  if (!speciesRow) {
    throw new Error("No species found");
  }
  const [breed] = await db
    .select()
    .from(breeds)
    .where(eq(breeds.speciesId, speciesRow.id))
    .limit(1);
  if (!breed) {
    throw new Error("No breed found");
  }
  return breed.id;
}

describe("POST /api/v1/pets", () => {
  it("creates pet with valid data and returns 201", async () => {
    const account = await createVerifiedAccount();
    const headers = await generateAuthHeader(account.id);
    const breedId = await getTestBreedId();

    const res = await app.request("/api/v1/pets", {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Buddy",
        breed_id: breedId,
        gender: "male",
        matching_preferences: ["female"],
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe("Buddy");
    expect(body.gender).toBe("male");
  });

  it("rejects invalid gender with 400", async () => {
    const account = await createVerifiedAccount();
    const headers = await generateAuthHeader(account.id);
    const breedId = await getTestBreedId();

    const res = await app.request("/api/v1/pets", {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Buddy",
        breed_id: breedId,
        gender: "invalid",
        matching_preferences: ["female"],
      }),
    });

    expect(res.status).toBe(400);
  });

  it("rejects invalid matching_preferences with 400", async () => {
    const account = await createVerifiedAccount();
    const headers = await generateAuthHeader(account.id);
    const breedId = await getTestBreedId();

    const res = await app.request("/api/v1/pets", {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Buddy",
        breed_id: breedId,
        gender: "male",
        matching_preferences: ["invalid"],
      }),
    });

    expect(res.status).toBe(400);
  });

  it("rejects non-existent breed_id with 400", async () => {
    const account = await createVerifiedAccount();
    const headers = await generateAuthHeader(account.id);

    const res = await app.request("/api/v1/pets", {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Buddy",
        breed_id: 99999,
        gender: "male",
        matching_preferences: ["female"],
      }),
    });

    expect(res.status).toBe(500);
  });
});

describe("PUT /api/v1/pets/:id", () => {
  it("updates own pet successfully", async () => {
    const account = await createVerifiedAccount();
    const headers = await generateAuthHeader(account.id);
    const pet = await createTestPet(account.id);
    const breedId = await getTestBreedId();

    const res = await app.request(`/api/v1/pets/${pet.id}`, {
      method: "PUT",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Max",
        breed_id: breedId,
        gender: "male",
        matching_preferences: ["female"],
      }),
    });

    expect(res.status).toBe(200);
  });

  it("returns 404 for non-existent pet", async () => {
    const account = await createVerifiedAccount();
    const headers = await generateAuthHeader(account.id);
    const breedId = await getTestBreedId();

    const res = await app.request(`/api/v1/pets/${crypto.randomUUID()}`, {
      method: "PUT",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Max",
        breed_id: breedId,
        gender: "male",
        matching_preferences: ["female"],
      }),
    });

    expect(res.status).toBe(404);
  });

  it("returns 404 for another users pet", async () => {
    const account1 = await createVerifiedAccount();
    const account2 = await createVerifiedAccount();
    const headers2 = await generateAuthHeader(account2.id);
    const pet = await createTestPet(account1.id);
    const breedId = await getTestBreedId();

    const res = await app.request(`/api/v1/pets/${pet.id}`, {
      method: "PUT",
      headers: {
        ...headers2,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Max",
        breed_id: breedId,
        gender: "male",
        matching_preferences: ["female"],
      }),
    });

    expect(res.status).toBe(404);
  });

  it("returns 404 for deleted pet", async () => {
    const account = await createVerifiedAccount();
    const headers = await generateAuthHeader(account.id);
    const pet = await createTestPet(account.id);
    const breedId = await getTestBreedId();

    await app.request(`/api/v1/pets/${pet.id}`, {
      method: "DELETE",
      headers,
    });

    const res = await app.request(`/api/v1/pets/${pet.id}`, {
      method: "PUT",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Max",
        breed_id: breedId,
        gender: "male",
        matching_preferences: ["female"],
      }),
    });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/v1/pets/:id", () => {
  it("soft-deletes own pet and returns 204", async () => {
    const account = await createVerifiedAccount();
    const headers = await generateAuthHeader(account.id);
    const pet = await createTestPet(account.id);

    const res = await app.request(`/api/v1/pets/${pet.id}`, {
      method: "DELETE",
      headers,
    });

    expect(res.status).toBe(204);
  });

  it("returns 404 for non-existent pet", async () => {
    const account = await createVerifiedAccount();
    const headers = await generateAuthHeader(account.id);

    const res = await app.request(`/api/v1/pets/${crypto.randomUUID()}`, {
      method: "DELETE",
      headers,
    });

    expect(res.status).toBe(404);
  });

  it("returns 404 for another users pet", async () => {
    const account1 = await createVerifiedAccount();
    const account2 = await createVerifiedAccount();
    const headers2 = await generateAuthHeader(account2.id);
    const pet = await createTestPet(account1.id);

    const res = await app.request(`/api/v1/pets/${pet.id}`, {
      method: "DELETE",
      headers: headers2,
    });

    expect(res.status).toBe(404);
  });
});

describe("POST /api/v1/pets/:id/restore", () => {
  it("restores deleted pet successfully", async () => {
    const account = await createVerifiedAccount();
    const headers = await generateAuthHeader(account.id);
    const pet = await createTestPet(account.id);

    await app.request(`/api/v1/pets/${pet.id}`, {
      method: "DELETE",
      headers,
    });

    const res = await app.request(`/api/v1/pets/${pet.id}/restore`, {
      method: "POST",
      headers,
    });

    expect(res.status).toBe(200);
  });
});

describe("GET /api/v1/pets/deleted", () => {
  it("returns list of deleted pets", async () => {
    const account = await createVerifiedAccount();
    const headers = await generateAuthHeader(account.id);
    const pet = await createTestPet(account.id);

    await app.request(`/api/v1/pets/${pet.id}`, {
      method: "DELETE",
      headers,
    });

    const res = await app.request("/api/v1/pets/deleted", {
      method: "GET",
      headers,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

describe("POST /api/v1/pets/:id/photos", () => {
  it("adds photo to pet and returns 201", async () => {
    const account = await createVerifiedAccount();
    const headers = await generateAuthHeader(account.id);
    const pet = await createTestPet(account.id);

    const res = await app.request(`/api/v1/pets/${pet.id}/photos`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.image_url).toBe(
      "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    );
  });

  it("returns 400 when adding 7th photo (max 6)", async () => {
    const account = await createVerifiedAccount();
    const headers = await generateAuthHeader(account.id);
    const petWithPhotos = await createTestPetWithPhotos(account.id, 6);

    const res = await app.request(`/api/v1/pets/${petWithPhotos.id}/photos`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: "https://res.cloudinary.com/demo/image/upload/extra.jpg",
      }),
    });

    expect(res.status).toBe(422);
  });

  it("returns 404 for non-existent pet", async () => {
    const account = await createVerifiedAccount();
    const headers = await generateAuthHeader(account.id);

    const res = await app.request(
      `/api/v1/pets/${crypto.randomUUID()}/photos`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        }),
      },
    );

    expect(res.status).toBe(404);
  });

  it("returns 404 for deleted pet", async () => {
    const account = await createVerifiedAccount();
    const headers = await generateAuthHeader(account.id);
    const pet = await createTestPet(account.id);

    await app.request(`/api/v1/pets/${pet.id}`, {
      method: "DELETE",
      headers,
    });

    const res = await app.request(`/api/v1/pets/${pet.id}/photos`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      }),
    });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/v1/pets/:id/photos/:photo_id", () => {
  it("deletes photo and returns 204", async () => {
    const account = await createVerifiedAccount();
    const headers = await generateAuthHeader(account.id);
    const petWithPhotos = await createTestPetWithPhotos(account.id, 1);

    const { petPhotos } = await import("@patty/api/db/schema/pets");
    const [photo] = await db
      .select()
      .from(petPhotos)
      .where(eq(petPhotos.petId, petWithPhotos.id))
      .limit(1);

    if (!photo) {
      throw new Error("No photo found");
    }

    const res = await app.request(
      `/api/v1/pets/${petWithPhotos.id}/photos/${photo.id}`,
      {
        method: "DELETE",
        headers,
      },
    );

    expect(res.status).toBe(204);
  });

  it("returns 404 for non-existent photo", async () => {
    const account = await createVerifiedAccount();
    const headers = await generateAuthHeader(account.id);
    const pet = await createTestPet(account.id);

    const res = await app.request(
      `/api/v1/pets/${pet.id}/photos/${crypto.randomUUID()}`,
      {
        method: "DELETE",
        headers,
      },
    );

    expect(res.status).toBe(404);
  });

  it("returns 404 for another users photo", async () => {
    const account1 = await createVerifiedAccount();
    const account2 = await createVerifiedAccount();
    const headers2 = await generateAuthHeader(account2.id);
    const pet1 = await createTestPetWithPhotos(account1.id, 1);

    const { petPhotos } = await import("@patty/api/db/schema/pets");
    const [photo] = await db
      .select()
      .from(petPhotos)
      .where(eq(petPhotos.petId, pet1.id))
      .limit(1);

    if (!photo) {
      throw new Error("No photo found");
    }

    const res = await app.request(
      `/api/v1/pets/${pet1.id}/photos/${photo.id}`,
      {
        method: "DELETE",
        headers: headers2,
      },
    );

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/v1/pets/:id/photos/order", () => {
  it("reorders photos successfully", async () => {
    const account = await createVerifiedAccount();
    const headers = await generateAuthHeader(account.id);
    const petWithPhotos = await createTestPetWithPhotos(account.id, 3);

    const { petPhotos } = await import("@patty/api/db/schema/pets");
    const photos = await db
      .select()
      .from(petPhotos)
      .where(eq(petPhotos.petId, petWithPhotos.id))
      .orderBy(petPhotos.displayOrder);

    if (photos.length < 3) {
      throw new Error("Not enough photos");
    }

    const photo0 = photos[0];
    const photo1 = photos[1];
    const photo2 = photos[2];
    if (!photo0 || !photo1 || !photo2) {
      throw new Error("Not enough photos");
    }

    const reorderedIds = [photo2.id, photo0.id, photo1.id];

    const res = await app.request(
      `/api/v1/pets/${petWithPhotos.id}/photos/order`,
      {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ordered_photo_ids: reorderedIds,
        }),
      },
    );

    expect(res.status).toBe(200);
  });
});
