import { db } from "@patty/api/db/client";
import { petPhotos, pets } from "@patty/api/db/schema";
import { AppError } from "@patty/api/lib/errors";
import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";

const MAX_PHOTOS_PER_PET = 6;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PetPhotoRow {
  id: string;
  petId: string;
  imageUrl: string;
  displayOrder: number;
  createdAt: Date | null;
}

export interface PetRow {
  id: string;
  accountId: string;
  name: string;
  breedId: number;
  birthDate: string | null;
  bio: string | null;
  energyLevel: number | null;
  gender: "male" | "female" | null;
  matchingPreferences: string[];
  metadata: unknown;
  deletedAt: Date | null;
  createdAt: Date | null;
  photos: PetPhotoRow[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapPhoto(r: typeof petPhotos.$inferSelect): PetPhotoRow {
  return {
    id: r.id,
    petId: r.petId,
    imageUrl: r.imageUrl,
    displayOrder: r.displayOrder ?? 0,
    createdAt: r.createdAt ?? null,
  };
}

type PetRawRow = Record<string, unknown> & {
  id: string;
  account_id: string;
  name: string;
  breed_id: number;
  birth_date: string | null;
  bio: string | null;
  energy_level: number | null;
  gender: "male" | "female" | null;
  matching_preferences: string[];
  metadata: unknown;
  deleted_at: Date | null;
  created_at: Date | null;
};

function mapPetRaw(r: PetRawRow, photos: PetPhotoRow[] = []): PetRow {
  return {
    id: r.id,
    accountId: r.account_id,
    name: r.name,
    breedId: r.breed_id,
    birthDate: r.birth_date ?? null,
    bio: r.bio ?? null,
    energyLevel: r.energy_level ?? null,
    gender: r.gender ?? null,
    matchingPreferences: Array.isArray(r.matching_preferences)
      ? r.matching_preferences
      : [],
    metadata: r.metadata,
    deletedAt: r.deleted_at ?? null,
    createdAt: r.created_at ?? null,
    photos,
  };
}

// ---------------------------------------------------------------------------
// Pet queries
// ---------------------------------------------------------------------------

/** Creates a new pet and returns the full row. */
export async function createPet(params: {
  id: string;
  accountId: string;
  name: string;
  breedId: number;
  birthDate: string | null;
  bio: string | null;
  gender: "male" | "female";
  matchingPreferences: ("male" | "female")[];
}): Promise<PetRow> {
  const prefs = `{${params.matchingPreferences.join(",")}}`;

  const rows = await db.execute<PetRawRow>(sql`
    INSERT INTO pets (id, account_id, name, breed_id, birth_date, bio, gender, matching_preferences)
    VALUES (
      ${params.id}::uuid,
      ${params.accountId}::uuid,
      ${params.name},
      ${params.breedId},
      ${params.birthDate ?? null}::date,
      ${params.bio ?? null},
      ${params.gender}::pet_gender,
      ${prefs}::pet_gender[]
    )
    RETURNING id, account_id, name, breed_id,
      birth_date::text as birth_date,
      bio, gender, matching_preferences,
      energy_level, metadata, deleted_at, created_at
  `);

  const row = rows[0];
  if (!row) throw AppError.internal("Failed to create pet");
  return mapPetRaw(row);
}

/** Updates a pet and returns the old row before mutation, or null if not found. */
export async function updatePet(
  petId: string,
  accountId: string,
  params: {
    name: string;
    breedId: number;
    birthDate: string | null;
    bio: string | null;
    gender: "male" | "female";
    matchingPreferences: ("male" | "female")[];
  },
): Promise<PetRow | null> {
  const prefs = `{${params.matchingPreferences.join(",")}}`;

  const rows = await db.execute<PetRawRow>(sql`
    UPDATE pets
    SET name = ${params.name},
        breed_id = ${params.breedId},
        birth_date = ${params.birthDate ?? null}::date,
        bio = ${params.bio ?? null},
        gender = ${params.gender}::pet_gender,
        matching_preferences = ${prefs}::pet_gender[]
    WHERE id = ${petId}::uuid AND account_id = ${accountId}::uuid AND deleted_at IS NULL
    RETURNING id, account_id, name, breed_id,
      birth_date::text as birth_date,
      bio, gender, matching_preferences,
      energy_level, metadata, deleted_at, created_at
  `);

  const row = rows[0];
  return row ? mapPetRaw(row) : null;
}

/** Soft-deletes a pet and returns the old row, or null if not found/already deleted. */
export async function deletePet(
  accountId: string,
  petId: string,
): Promise<PetRow | null> {
  const rows = await db.execute<PetRawRow>(sql`
    UPDATE pets SET deleted_at = NOW()
    WHERE id = ${petId}::uuid AND account_id = ${accountId}::uuid AND deleted_at IS NULL
    RETURNING id, account_id, name, breed_id,
      birth_date::text as birth_date,
      bio, gender, matching_preferences,
      energy_level, metadata, deleted_at, created_at
  `);

  const row = rows[0];
  return row ? mapPetRaw(row) : null;
}

/** Returns all soft-deleted pets for an account. */
export async function findDeletedPets(accountId: string): Promise<PetRow[]> {
  const rows = await db.execute<PetRawRow>(sql`
    SELECT id, account_id, name, breed_id,
      birth_date::text as birth_date,
      bio, gender, matching_preferences,
      energy_level, metadata, deleted_at, created_at
    FROM pets
    WHERE account_id = ${accountId}::uuid AND deleted_at IS NOT NULL
    ORDER BY deleted_at DESC
  `);

  return rows.map((r) => mapPetRaw(r));
}

/** Restores a soft-deleted pet. */
export async function restorePet(
  accountId: string,
  petId: string,
): Promise<void> {
  await db
    .update(pets)
    .set({ deletedAt: null })
    .where(
      and(
        eq(pets.id, petId),
        eq(pets.accountId, accountId),
        isNotNull(pets.deletedAt),
      ),
    );
}

/** Returns a single active pet by ID. */
export async function findPetById(petId: string): Promise<PetRow | null> {
  const rows = await db.execute<PetRawRow>(sql`
    SELECT id, account_id, name, breed_id,
      birth_date::text as birth_date,
      bio, gender, matching_preferences,
      energy_level, metadata, deleted_at, created_at
    FROM pets
    WHERE id = ${petId}::uuid AND deleted_at IS NULL
  `);

  const row = rows[0];
  return row ? mapPetRaw(row) : null;
}

// ---------------------------------------------------------------------------
// Photo queries
// ---------------------------------------------------------------------------

/** Returns photo count for a pet. */
async function countPhotos(petId: string): Promise<number> {
  const result = await db.execute<{ count: string }>(sql`
    SELECT COUNT(*)::text as count FROM pet_photos WHERE pet_id = ${petId}::uuid
  `);
  return parseInt(result[0]?.count ?? "0", 10);
}

/** Verifies that a pet exists and belongs to the given account. */
async function assertPetOwnership(
  petId: string,
  accountId: string,
): Promise<void> {
  const rows = await db
    .select({ id: pets.id })
    .from(pets)
    .where(
      and(
        eq(pets.id, petId),
        eq(pets.accountId, accountId),
        isNull(pets.deletedAt),
      ),
    )
    .limit(1);

  if (rows.length === 0) throw AppError.notFound("Pet not found");
}

/**
 * Adds a photo to a pet.
 * @throws AppError.validation if max photos reached.
 * @throws AppError.notFound if pet not found or not owned by account.
 */
export async function addPhoto(
  petId: string,
  accountId: string,
  photoId: string,
  imageUrl: string,
): Promise<PetPhotoRow> {
  await assertPetOwnership(petId, accountId);

  const count = await countPhotos(petId);
  if (count >= MAX_PHOTOS_PER_PET) {
    throw AppError.validation(
      `Maximum of ${MAX_PHOTOS_PER_PET} photos allowed per pet`,
    );
  }

  const [inserted] = await db
    .insert(petPhotos)
    .values({
      id: photoId,
      petId,
      imageUrl,
      displayOrder: count,
    })
    .returning();

  if (!inserted) throw AppError.internal("Failed to insert photo");
  return mapPhoto(inserted);
}

/**
 * Removes a photo from a pet.
 * @returns The removed photo, or null if not found.
 */
export async function removePhoto(
  petId: string,
  accountId: string,
  photoId: string,
): Promise<PetPhotoRow | null> {
  // Verify ownership — returns null instead of throwing if pet not found.
  const petRows = await db
    .select({ id: pets.id })
    .from(pets)
    .where(
      and(
        eq(pets.id, petId),
        eq(pets.accountId, accountId),
        isNull(pets.deletedAt),
      ),
    )
    .limit(1);

  if (petRows.length === 0) return null;

  const deleted = await db
    .delete(petPhotos)
    .where(and(eq(petPhotos.id, photoId), eq(petPhotos.petId, petId)))
    .returning();

  const row = deleted[0];
  return row ? mapPhoto(row) : null;
}

/** Reorders photos for a pet using the provided ordered photo IDs. */
export async function reorderPhotos(
  petId: string,
  accountId: string,
  orderedIds: string[],
): Promise<void> {
  if (orderedIds.length === 0) return;

  await assertPetOwnership(petId, accountId);

  // Build arrays for unnest bulk update.
  const idList = sql.join(
    orderedIds.map((id) => sql`${id}::uuid`),
    sql`, `,
  );
  const orderList = sql.join(
    orderedIds.map((_, i) => sql`${i}`),
    sql`, `,
  );

  await db.execute(sql`
    UPDATE pet_photos
    SET display_order = updates.new_order
    FROM (
      SELECT unnest(ARRAY[${idList}]) as id,
             unnest(ARRAY[${orderList}]::int[]) as new_order
    ) AS updates
    WHERE pet_photos.id = updates.id AND pet_photos.pet_id = ${petId}::uuid
  `);
}

/** Returns all photos for a pet, ordered by display_order. */
export async function getPhotos(petId: string): Promise<PetPhotoRow[]> {
  const rows = await db
    .select()
    .from(petPhotos)
    .where(eq(petPhotos.petId, petId))
    .orderBy(petPhotos.displayOrder, petPhotos.createdAt);

  return rows.map(mapPhoto);
}

// ---------------------------------------------------------------------------
// Account pets (for profile building)
// ---------------------------------------------------------------------------

/** Returns pets with photos for an account. */
export async function getAccountPets(accountId: string): Promise<PetRow[]> {
  const rawPets = await db
    .select()
    .from(pets)
    .where(and(eq(pets.accountId, accountId), isNull(pets.deletedAt)));

  if (rawPets.length === 0) return [];

  const petIds = rawPets.map((p) => p.id);
  const allPhotos = await db
    .select()
    .from(petPhotos)
    .where(
      sql`${petPhotos.petId} = ANY(ARRAY[${sql.join(
        petIds.map((id) => sql`${id}::uuid`),
        sql`, `,
      )}])`,
    );

  const photosByPet = new Map<string, PetPhotoRow[]>();
  for (const photo of allPhotos) {
    const list = photosByPet.get(photo.petId) ?? [];
    list.push({
      id: photo.id,
      petId: photo.petId,
      imageUrl: photo.imageUrl,
      displayOrder: photo.displayOrder ?? 0,
      createdAt: photo.createdAt ?? null,
    });
    photosByPet.set(photo.petId, list);
  }

  return rawPets.map((p) => ({
    id: p.id,
    accountId: p.accountId,
    name: p.name,
    breedId: p.breedId,
    birthDate: p.birthDate ?? null,
    bio: p.bio ?? null,
    energyLevel: p.energyLevel ?? null,
    gender: p.gender ?? null,
    matchingPreferences: [],
    metadata: p.metadata,
    deletedAt: p.deletedAt ?? null,
    createdAt: p.createdAt ?? null,
    photos: photosByPet.get(p.id) ?? [],
  }));
}
