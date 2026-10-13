import { db } from "@patty/api/db/client";
import { petPhotos, pets } from "@patty/api/db/schema/pets";
import { breeds, species } from "@patty/api/db/schema/species";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

export interface TestPetOverrides {
  name?: string;
  breedId?: number;
  birthDate?: string | null;
  bio?: string | null;
  energyLevel?: number;
  gender?: "male" | "female";
  matchingPreferences?: ("male" | "female")[];
}

export async function createTestPet(
  accountId: string,
  overrides?: TestPetOverrides,
): Promise<{ id: string; accountId: string }> {
  let breedId: number;

  if (overrides?.breedId) {
    breedId = overrides.breedId;
  } else {
    const [speciesRow] = await db
      .select()
      .from(species)
      .limit(1)
      .where(eq(species.nameEn, "Dog"));

    if (speciesRow) {
      const [breedRow] = await db
        .select()
        .from(breeds)
        .where(eq(breeds.speciesId, speciesRow.id))
        .limit(1);
      if (breedRow) {
        breedId = breedRow.id;
      } else {
        const [breed] = await db
          .insert(breeds)
          .values({
            speciesId: 1,
            nameEn: "Mixed",
            nameTr: "Melez",
          })
          .returning({ id: breeds.id });
        if (!breed) {
          throw new Error("Failed to create breed");
        }
        breedId = breed.id;
      }
    } else {
      const [breed] = await db
        .insert(breeds)
        .values({
          speciesId: 1,
          nameEn: "Mixed",
          nameTr: "Melez",
        })
        .returning({ id: breeds.id });
      if (!breed) {
        throw new Error("Failed to create breed");
      }
      breedId = breed.id;
    }
  }

  const [pet] = await db
    .insert(pets)
    .values({
      accountId,
      name: overrides?.name ?? "TestPet",
      breedId,
      birthDate: overrides?.birthDate ?? null,
      bio: overrides?.bio ?? null,
      energyLevel: overrides?.energyLevel ?? 3,
      gender: overrides?.gender ?? "male",
    })
    .returning({ id: pets.id, accountId: pets.accountId });

  if (!pet) {
    throw new Error("Failed to create test pet");
  }

  if (overrides?.matchingPreferences) {
    // PostgreSQL array literal format: {male,female} — pass as text then cast.
    const arrayLiteral = `{${overrides.matchingPreferences.join(",")}}`;
    await db.execute(sql`
      UPDATE pets
      SET matching_preferences = ${arrayLiteral}::pet_gender[]
      WHERE id = ${pet.id}::uuid
    `);
  }

  return { id: pet.id, accountId: pet.accountId };
}

export interface TestPetPhotoOverrides {
  imageUrl?: string;
  displayOrder?: number;
}

export async function createTestPetWithPhotos(
  accountId: string,
  photoCount: number,
  overrides?: TestPetOverrides & TestPetPhotoOverrides,
): Promise<{ id: string; accountId: string; photoCount: number }> {
  const { imageUrl, displayOrder, ...petOverrides } = overrides ?? {};
  const pet = await createTestPet(accountId, petOverrides);

  const defaultImageUrl =
    "https://res.cloudinary.com/demo/image/upload/sample.jpg";
  const image = imageUrl ?? defaultImageUrl;

  const photosToInsert = Array.from(
    { length: photoCount },
    (_, i): typeof petPhotos.$inferInsert => ({
      petId: pet.id,
      imageUrl: image,
      displayOrder: displayOrder ?? i,
    }),
  );

  await db.insert(petPhotos).values(photosToInsert);

  return { ...pet, photoCount };
}

export async function deleteTestPet(id: string): Promise<void> {
  await db.delete(pets).where(eq(pets.id, id));
}
