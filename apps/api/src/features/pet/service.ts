import { AppError } from "@patty/api/lib/errors";
import { randomUUID } from "crypto";

import type { PetPhotoRow, PetRow } from "./repository";
import * as repo from "./repository";

// ---------------------------------------------------------------------------
// Response formatters
// ---------------------------------------------------------------------------

/** Maps a PetRow (camelCase) to the API response shape (snake_case). */
export function formatPet(p: PetRow) {
  return {
    id: p.id,
    account_id: p.accountId,
    name: p.name,
    breed_id: p.breedId,
    birth_date: p.birthDate,
    bio: p.bio,
    energy_level: p.energyLevel,
    gender: p.gender,
    matching_preferences: p.matchingPreferences,
    photos: p.photos.map((ph) => formatPhoto(ph)),
    metadata: p.metadata,
    deleted_at: p.deletedAt,
    created_at: p.createdAt,
  };
}

/** Maps a PetPhotoRow (camelCase) to the API response shape (snake_case). */
export function formatPhoto(ph: PetPhotoRow) {
  return {
    id: ph.id,
    pet_id: ph.petId,
    image_url: ph.imageUrl,
    display_order: ph.displayOrder,
    created_at: ph.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Pet operations
// ---------------------------------------------------------------------------

/** Creates a new pet for the given account. */
export async function createPet(
  accountId: string,
  data: {
    id?: string;
    name: string;
    breed_id: number;
    birth_date?: string | null;
    bio?: string | null;
    gender: "male" | "female";
    matching_preferences: ("male" | "female")[];
  },
) {
  const pet = await repo.createPet({
    id: data.id ?? randomUUID(),
    accountId,
    name: data.name,
    breedId: data.breed_id,
    birthDate: data.birth_date ?? null,
    bio: data.bio ?? null,
    gender: data.gender,
    matchingPreferences: data.matching_preferences,
  });

  return formatPet(pet);
}

/** Updates an existing pet. Throws if not found. */
export async function updatePet(
  petId: string,
  accountId: string,
  data: {
    name?: string;
    breed_id?: number;
    birth_date?: string | null;
    bio?: string | null;
    gender?: "male" | "female";
    matching_preferences?: ("male" | "female")[];
  },
) {
  const updated = await repo.updatePet(petId, accountId, {
    name: data.name ?? "",
    breedId: data.breed_id ?? 0,
    birthDate: data.birth_date ?? null,
    bio: data.bio ?? null,
    gender: data.gender ?? "male",
    matchingPreferences: data.matching_preferences ?? ["male", "female"],
  });

  if (!updated) throw AppError.notFound("Pet not found");
}

/** Soft-deletes a pet. Throws if not found. */
export async function deletePet(
  accountId: string,
  petId: string,
): Promise<void> {
  const deleted = await repo.deletePet(accountId, petId);
  if (!deleted) throw AppError.notFound("Pet not found");
}

/** Returns all soft-deleted pets for an account, formatted for the API. */
export async function getDeletedPets(accountId: string) {
  const rows = await repo.findDeletedPets(accountId);
  return rows.map(formatPet);
}

/** Restores a soft-deleted pet. */
export async function restorePet(
  accountId: string,
  petId: string,
): Promise<void> {
  await repo.restorePet(accountId, petId);
}

// ---------------------------------------------------------------------------
// Photo operations
// ---------------------------------------------------------------------------

/** Adds a photo to a pet. Returns the formatted photo. */
export async function addPhoto(
  petId: string,
  accountId: string,
  imageUrl: string,
) {
  const photo = await repo.addPhoto(petId, accountId, randomUUID(), imageUrl);
  return formatPhoto(photo);
}

/** Removes a photo from a pet. Throws if not found. */
export async function removePhoto(
  petId: string,
  accountId: string,
  photoId: string,
): Promise<void> {
  const removed = await repo.removePhoto(petId, accountId, photoId);
  if (!removed) throw AppError.notFound("Photo not found");
}

/** Reorders photos for a pet. */
export async function reorderPhotos(
  petId: string,
  accountId: string,
  orderedPhotoIds: string[],
): Promise<void> {
  await repo.reorderPhotos(petId, accountId, orderedPhotoIds);
}
