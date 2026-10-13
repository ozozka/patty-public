import { db } from "@patty/api/db/client";
import { breeds, locations, species } from "@patty/api/db/schema";
import { redis } from "@patty/api/lib/redis";
import { asc, sql } from "drizzle-orm";

export interface Location {
  id: number;
  parent_id: number | null;
  name_tr: string;
  name_en: string;
  level: "province" | "district";
}

export interface BreedRow {
  id: number;
  species_id: number;
  name_en: string;
  name_tr: string;
}

export interface SpeciesWithBreeds {
  id: number;
  name_en: string;
  name_tr: string;
  breeds: BreedRow[];
}

// Redis cache TTL for static reference data — 24 hours.
// Data is shared across instances and survives process restarts.
const CACHE_TTL_SECONDS = 86_400;

/** Returns all locations ordered by level then Turkish name. */
export async function listLocations(): Promise<Location[]> {
  // Fail open on Redis errors — fall through to DB if cache is unavailable.
  try {
    const cached = await redis.get("cache:locations");
    if (cached !== null) {
      // JSON.parse returns `any` — assignable to Location[] without assertion
      return JSON.parse(cached);
    }
  } catch {
    // Redis unavailable — proceed to DB query below.
  }

  const rows = await db
    .select()
    .from(locations)
    .orderBy(asc(locations.level), asc(locations.nameTr));

  const result: Location[] = rows.map((r) => ({
    id: r.id,
    parent_id: r.parentId ?? null,
    name_tr: r.nameTr,
    name_en: r.nameEn,
    level: r.level,
  }));

  // Best-effort cache write — ignore errors so a Redis blip doesn't fail the response.
  try {
    await redis.send("SET", [
      "cache:locations",
      JSON.stringify(result),
      "EX",
      String(CACHE_TTL_SECONDS),
    ]);
  } catch {
    // Cache write failed — response still succeeds with DB data.
  }

  return result;
}

/** Row returned by raw PostGIS resolve query. */
type LocationRaw = Record<string, unknown> & {
  id: number;
  parent_id: number | null;
  name_tr: string;
  name_en: string;
  level: "province" | "district";
};

/**
 * Resolves a coordinate pair to the most specific matching location.
 * First tries exact PostGIS polygon containment; falls back to nearest
 * centre point within 50 km.
 */
export async function resolveLocation(
  lat: number,
  lon: number,
): Promise<Location | null> {
  // Raw SQL required for PostGIS functions not covered by Drizzle helpers.
  const polyResult = await db.execute<LocationRaw>(sql`
    SELECT id, parent_id, name_tr, name_en, level
    FROM locations
    WHERE geom IS NOT NULL
      AND ST_Contains(geom, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326))
    ORDER BY level DESC
    LIMIT 1
  `);

  const polyRow = polyResult[0];
  if (polyRow) {
    return {
      id: polyRow.id,
      parent_id: polyRow.parent_id,
      name_tr: polyRow.name_tr,
      name_en: polyRow.name_en,
      level: polyRow.level,
    };
  }

  // Fallback: nearest centre within 50 km.
  const nearResult = await db.execute<LocationRaw>(sql`
    SELECT id, parent_id, name_tr, name_en, level
    FROM locations
    WHERE center IS NOT NULL
      AND ST_DWithin(
        center,
        ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography,
        50000
      )
    ORDER BY
      ST_Distance(center, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography) ASC,
      level DESC
    LIMIT 1
  `);

  const nearRow = nearResult[0];
  if (!nearRow) return null;

  return {
    id: nearRow.id,
    parent_id: nearRow.parent_id,
    name_tr: nearRow.name_tr,
    name_en: nearRow.name_en,
    level: nearRow.level,
  };
}

/** Returns all species with their associated breeds. */
export async function listPetTypes(): Promise<SpeciesWithBreeds[]> {
  // Fail open on Redis errors — fall through to DB if cache is unavailable.
  try {
    const cached = await redis.get("cache:pet_types");
    if (cached !== null) {
      // JSON.parse returns `any` — assignable to SpeciesWithBreeds[] without assertion
      return JSON.parse(cached);
    }
  } catch {
    // Redis unavailable — proceed to DB query below.
  }

  const speciesRows = await db.select().from(species).orderBy(asc(species.id));
  const breedRows = await db.select().from(breeds).orderBy(asc(breeds.nameEn));

  const result: SpeciesWithBreeds[] = speciesRows.map((s) => ({
    id: s.id,
    name_en: s.nameEn,
    name_tr: s.nameTr,
    breeds: breedRows
      .filter((b) => b.speciesId === s.id)
      .map((b) => ({
        id: b.id,
        species_id: b.speciesId,
        name_en: b.nameEn,
        name_tr: b.nameTr,
      })),
  }));

  // Best-effort cache write — ignore errors so a Redis blip doesn't fail the response.
  try {
    await redis.send("SET", [
      "cache:pet_types",
      JSON.stringify(result),
      "EX",
      String(CACHE_TTL_SECONDS),
    ]);
  } catch {
    // Cache write failed — response still succeeds with DB data.
  }

  return result;
}
