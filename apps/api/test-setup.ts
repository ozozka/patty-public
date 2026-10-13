// Loaded by bunfig.toml before any module is imported.
// ??= only fires when the env var is not already set (e.g., CI loads .env.test first).
process.env.DATABASE_URL ??= "postgresql://pati:pati@localhost:5432/pati_test";
process.env.JWT_SECRET ??= "test-secret-key-that-is-at-least-32-chars";
process.env.ADMIN_JWT_SECRET ??= "test-admin-secret-key-that-is-at-least-32";
process.env.CLOUDINARY_CLOUD_NAME ??= "test";
process.env.CLOUDINARY_API_KEY ??= "test";
process.env.CLOUDINARY_API_SECRET ??= "test";
process.env.RESEND_API_KEY ??= "re_placeholder";
process.env.RESEND_SENDER_EMAIL ??= "test@patty.app";
process.env.PORT ??= "8080";
process.env.LOG_LEVEL ??= "silent";
process.env.DB_POOL_SIZE ??= "5";
process.env.EMAIL_IP_THROTTLE_LIMIT ??= "10";
process.env.EMAIL_DAILY_CAP ??= "100";

import { runMigrations } from "@patty/api/db/migrate";
import { db } from "@patty/api/db/client";
import { locations } from "@patty/api/db/schema/locations";
import {
  breeds as breedsTable,
  species as speciesTable,
} from "@patty/api/db/schema/species";
import { inArray } from "drizzle-orm";

const TURKISH_PROVINCES = [
  { nameTr: "İstanbul", nameEn: "Istanbul" },
  { nameTr: "Ankara", nameEn: "Ankara" },
  { nameTr: "İzmir", nameEn: "Izmir" },
  { nameTr: "Antalya", nameEn: "Antalya" },
  { nameTr: "Bursa", nameEn: "Bursa" },
];

const TURKISH_DISTRICTS = [
  { nameTr: "Kadıköy", nameEn: "Kadikoy" },
  { nameTr: "Beşiktaş", nameEn: "Besiktas" },
  { nameTr: "Çankaya", nameEn: "Cankaya" },
  { nameTr: "Konak", nameEn: "Konak" },
  { nameTr: "Muratpaşa", nameEn: "Muratpasa" },
];

const SPECIES_DATA = [
  { nameEn: "Dog", nameTr: "Köpek" },
  { nameEn: "Cat", nameTr: "Kedi" },
  { nameEn: "Bird", nameTr: "Kuş" },
  { nameEn: "Rabbit", nameTr: "Tavşan" },
  { nameEn: "Hamster", nameTr: "Hamster" },
];

const BREEDS_DATA: Record<string, { nameEn: string; nameTr: string }[]> = {
  Dog: [
    { nameEn: "Golden Retriever", nameTr: "Golden Retriever" },
    { nameEn: "German Shepherd", nameTr: "Alman Çoban Köpeği" },
    { nameEn: "Labrador", nameTr: "Labrador" },
    { nameEn: "Poodle", nameTr: "Kaniş" },
    { nameEn: "Mixed", nameTr: "Melez" },
  ],
  Cat: [
    { nameEn: "Persian", nameTr: "Pers" },
    { nameEn: "Siamese", nameTr: "Siyam" },
    { nameEn: "British Shorthair", nameTr: "British Shorthair" },
    { nameEn: "Mixed", nameTr: "Melez" },
  ],
  Bird: [
    { nameEn: "Parrot", nameTr: "Papağan" },
    { nameEn: "Canary", nameTr: "Kanarya" },
    { nameEn: "Budgerigar", nameTr: "Muhabbet Kuşu" },
  ],
  Rabbit: [
    { nameEn: "Holland Lop", nameTr: "Holland Lop" },
    { nameEn: "Netherland Dwarf", nameTr: "Netherland Cüce" },
    { nameEn: "Mixed", nameTr: "Melez" },
  ],
  Hamster: [
    { nameEn: "Syrian", nameTr: "Suriye" },
    { nameEn: "Dwarf", nameTr: "Cüce" },
  ],
};

async function resetDatabase(): Promise<void> {
  await db.execute("DELETE FROM pet_photos");
  await db.execute("DELETE FROM pets");
  await db.execute("DELETE FROM swipes");
  await db.execute("DELETE FROM matches");
  await db.execute("DELETE FROM messages");
  await db.execute("DELETE FROM reports");
  await db.execute("DELETE FROM user_blocks");
  await db.execute("DELETE FROM email_verification_codes");
  await db.execute("DELETE FROM password_reset_codes");
  await db.execute("DELETE FROM phone_verification_codes");
  await db.execute("DELETE FROM accounts");
}

async function seedTestData(): Promise<void> {
  const provinceValues = TURKISH_PROVINCES.map((p) => ({
    ...p,
    level: "province" as const,
    parentId: null,
  }));
  await db.insert(locations).values(provinceValues).onConflictDoNothing();

  const existingProvinces = await db
    .select({ id: locations.id, nameEn: locations.nameEn })
    .from(locations)
    .where(
      inArray(
        locations.nameEn,
        TURKISH_PROVINCES.map((p) => p.nameEn),
      ),
    );

  const istanbul = existingProvinces.find((p) => p.nameEn === "Istanbul");
  const ankara = existingProvinces.find((p) => p.nameEn === "Ankara");
  const izmir = existingProvinces.find((p) => p.nameEn === "Izmir");

  const districtValues = [
    ...(istanbul
      ? TURKISH_DISTRICTS.slice(0, 2).map((d) => ({
          ...d,
          level: "district" as const,
          parentId: istanbul.id,
        }))
      : []),
    ...(ankara
      ? TURKISH_DISTRICTS.slice(2, 3).map((d) => ({
          ...d,
          level: "district" as const,
          parentId: ankara.id,
        }))
      : []),
    ...(izmir
      ? TURKISH_DISTRICTS.slice(3).map((d) => ({
          ...d,
          level: "district" as const,
          parentId: izmir.id,
        }))
      : []),
  ];
  if (districtValues.length > 0) {
    await db.insert(locations).values(districtValues).onConflictDoNothing();
  }

  await db.insert(speciesTable).values(SPECIES_DATA).onConflictDoNothing();

  const allSpecies = await db
    .select({ id: speciesTable.id, nameEn: speciesTable.nameEn })
    .from(speciesTable)
    .where(inArray(speciesTable.nameEn, Object.keys(BREEDS_DATA)));

  for (const sp of allSpecies) {
    const breedsForSpecies = BREEDS_DATA[sp.nameEn];
    if (breedsForSpecies) {
      const breedValues = breedsForSpecies.map((b) => ({
        speciesId: sp.id,
        nameEn: b.nameEn,
        nameTr: b.nameTr,
      }));
      await db.insert(breedsTable).values(breedValues).onConflictDoNothing();
    }
  }
}

try {
  await db.execute("SELECT 1");
} catch (cause) {
  throw new Error(
    "Database connection failed. Ensure PostgreSQL is running and DATABASE_URL is correct.",
    { cause },
  );
}

await runMigrations();
await resetDatabase();
await seedTestData();
