#!/usr/bin/env bun
/**
 * Generates two Drizzle migration SQL files from GADM v4.1 Turkey GeoJSON data.
 *
 *   apps/api/drizzle/0002_location_districts.sql
 *     - Replaces the (name_en, level) unique constraint with partial indexes
 *       that allow districts in different provinces to share the same English name
 *       (e.g. every province has a 'Merkez' district)
 *     - Inserts ~973 Turkish districts with parent_id resolved by province name
 *
 *   apps/api/drizzle/0003_location_geometry.sql
 *     - Updates geom for all 81 provinces (GADM level-1) and ~973 districts (level-2)
 *     - Geometry uses ST_SimplifyPreserveTopology(tolerance=0.01°, ~1 km) to reduce
 *       the stored polygon vertex count while keeping spatial query accuracy
 *     - Derives center from ST_Centroid(geom) for all locations in one batch
 *
 * Also updates apps/api/drizzle/meta/_journal.json with the two new migration entries.
 *
 * ── Prerequisites ─────────────────────────────────────────────────────────────
 *
 *   1. Go to https://gadm.org/download_country.html
 *   2. Select "Turkey" → Format: "GeoJSON" → Level: "1"  → download
 *   3. Select "Turkey" → Format: "GeoJSON" → Level: "2"  → download
 *   4. Place both files at:
 *        scripts/data/gadm41_TUR_1.json   (provinces)
 *        scripts/data/gadm41_TUR_2.json   (districts)
 *   5. Run: bun run scripts/generate-location-sql.ts
 *   6. Commit the generated SQL files + updated _journal.json
 *
 * ── Re-running ────────────────────────────────────────────────────────────────
 *
 *   Re-run if Turkey's administrative boundaries change.  The script is
 *   idempotent: it overwrites the SQL files and skips journal entries that
 *   already exist.  After re-running, apply with `just api dev` (or
 *   `just api db-migrate`).
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const SCRIPT_DIR = import.meta.dir;
const REPO_ROOT = join(SCRIPT_DIR, "..");
const DATA_DIR = join(SCRIPT_DIR, "data");
const DRIZZLE_DIR = join(REPO_ROOT, "apps", "api", "drizzle");

const GADM_L1_PATH = join(DATA_DIR, "gadm41_TUR_1.json");
const GADM_L2_PATH = join(DATA_DIR, "gadm41_TUR_2.json");
const OUT_0002 = join(DRIZZLE_DIR, "0002_location_districts.sql");
const OUT_0003 = join(DRIZZLE_DIR, "0003_location_geometry.sql");
const JOURNAL_PATH = join(DRIZZLE_DIR, "meta", "_journal.json");

// ---------------------------------------------------------------------------
// Types (inline to avoid external dependencies)
// ---------------------------------------------------------------------------

type Coordinate = number[];
type Ring = Coordinate[];
type GeoJSONGeometry =
  | { type: "Polygon"; coordinates: Ring[] }
  | { type: "MultiPolygon"; coordinates: Ring[][] };

interface GeoJSONFeature {
  type: "Feature";
  properties: Record<string, unknown> | null;
  geometry: GeoJSONGeometry | null;
}

interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

interface JournalEntry {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
}

interface Journal {
  version: string;
  dialect: string;
  entries: JournalEntry[];
}

// ---------------------------------------------------------------------------
// Province name overrides
//
// GADM uses Turkish names with diacritics; we transliterate them to produce
// the name_en stored in the DB (seeded by 0001_seed_reference_data.sql).
// Add overrides here for any GADM name that doesn't transliterate cleanly.
// ---------------------------------------------------------------------------

const PROVINCE_OVERRIDES: Record<string, string> = {
  // GADM uses the historic name 'Icel' for the province officially renamed 'Mersin'.
  Icel: "Mersin",
  // GADM uses the short form 'Afyon' instead of the full official name.
  Afyon: "Afyonkarahisar",
  // GADM uses the abbreviated form 'K.Maraş' → transliterates to 'K.Maras'.
  "K.Maras": "Kahramanmaras",
  // GADM uses 'Kınkkale' → transliterates to 'Kinkkale'.
  Kinkkale: "Kirikkale",
  // GADM uses the older spelling 'Zinguldak' instead of 'Zonguldak'.
  Zinguldak: "Zonguldak",
};

// ---------------------------------------------------------------------------
// Turkish → ASCII transliteration
//
// Matches the convention used in 0001_seed_reference_data.sql.
// ---------------------------------------------------------------------------

function transliterate(str: string): string {
  return str
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "G")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "U")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "S")
    .replace(/ı/g, "i")
    .replace(/İ/g, "I")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "O")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "C");
}

// ---------------------------------------------------------------------------
// Coordinate precision reduction
//
// GADM stores up to 15 decimal places (~0.1 mm accuracy).  5 decimal places
// (~1 m) is sufficient for province/district boundary matching and reduces
// the JSON payload embedded in SQL by ~60%.
// ---------------------------------------------------------------------------

function reducePrecision(coord: Coordinate): Coordinate {
  return coord.map((n) => Math.round(n * 100000) / 100000);
}

function reducePrecisionRing(ring: Ring): Ring {
  return ring.map(reducePrecision);
}

function reducePrecisionGeometry(geom: GeoJSONGeometry): GeoJSONGeometry {
  if (geom.type === "Polygon") {
    return {
      type: "Polygon",
      coordinates: geom.coordinates.map(reducePrecisionRing),
    };
  }
  return {
    type: "MultiPolygon",
    coordinates: geom.coordinates.map((poly) =>
      poly.map(reducePrecisionRing),
    ),
  };
}

// ---------------------------------------------------------------------------
// SQL helpers
// ---------------------------------------------------------------------------

function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

/**
 * Produces a PostGIS expression that:
 *   1. Parses the GeoJSON geometry
 *   2. Assigns SRID 4326
 *   3. Simplifies with topology-preservation (tolerance 0.01° ≈ 1 km)
 *   4. Ensures the result is always a MultiPolygon
 *
 * ST_SimplifyPreserveTopology is used instead of ST_Simplify to prevent
 * degenerate (self-intersecting) polygons after simplification.
 */
function toPostGISExpr(geom: GeoJSONGeometry): string {
  const reduced = reducePrecisionGeometry(geom);
  const geomJson = JSON.stringify(reduced);
  const escaped = escapeSql(geomJson);
  return (
    `ST_Multi(ST_SimplifyPreserveTopology(` +
    `ST_SetSRID(ST_GeomFromGeoJSON('${escaped}'), 4326), 0.01))`
  );
}

// ---------------------------------------------------------------------------
// 0002 generator: unique constraint + district INSERTs
// ---------------------------------------------------------------------------

function generate0002(
  districtFeatures: GeoJSONFeature[],
  provinceMap: Map<string, string>,
): void {
  const lines: string[] = [
    `-- Generated by scripts/generate-location-sql.ts`,
    `-- Source: GADM v4.1 Turkey level-2 (districts)`,
    `-- DO NOT EDIT MANUALLY — re-run the generator to regenerate`,
    ``,
    `-- Step 1: Replace (name_en, level) unique constraint.`,
    `-- The old constraint blocks duplicate district names across provinces`,
    `-- (Turkey has ~81 'Merkez' districts, one per province).`,
    `ALTER TABLE locations`,
    `  DROP CONSTRAINT IF EXISTS "locations_name_en_level_unique";`,
    ``,
    `-- Province names remain globally unique across the entire table.`,
    `CREATE UNIQUE INDEX IF NOT EXISTS uq_locations_province_name`,
    `  ON locations (name_en) WHERE level = 'province';`,
    ``,
    `-- District names must be unique within their parent province.`,
    `CREATE UNIQUE INDEX IF NOT EXISTS uq_locations_district_name`,
    `  ON locations (name_en, parent_id) WHERE level = 'district';`,
    ``,
    `-- Step 2: Insert districts.`,
    `-- parent_id is resolved by province name_en to avoid hardcoding serial IDs.`,
    `-- ON CONFLICT DO NOTHING makes this idempotent.`,
    ``,
  ];

  const unmatched = new Set<string>();
  let count = 0;

  for (const feature of districtFeatures) {
    const gadmProvince = feature.properties?.["NAME_1"];
    const gadmDistrict = feature.properties?.["NAME_2"];
    if (typeof gadmProvince !== "string" || typeof gadmDistrict !== "string")
      continue;

    const dbProvinceName = provinceMap.get(gadmProvince);
    if (!dbProvinceName) {
      unmatched.add(gadmProvince);
      continue;
    }

    const nameTr = gadmDistrict;
    const nameEn = transliterate(gadmDistrict);

    lines.push(`INSERT INTO locations (name_tr, name_en, level, parent_id)`);
    lines.push(`SELECT '${escapeSql(nameTr)}', '${escapeSql(nameEn)}', 'district', id`);
    lines.push(
      `FROM locations WHERE name_en = '${escapeSql(dbProvinceName)}' AND level = 'province'`,
    );
    lines.push(`ON CONFLICT DO NOTHING;`);

    count++;
  }

  writeFileSync(OUT_0002, lines.join("\n") + "\n");
  console.log(`0002: wrote ${count} district INSERT statements`);

  if (unmatched.size > 0) {
    console.warn(`\n⚠️  Unmatched province names in GADM level-2:`);
    for (const name of unmatched) {
      console.warn(
        `  "${name}" → transliterates to "${transliterate(name)}" → no DB match`,
      );
    }
    console.warn(
      `   Add to PROVINCE_OVERRIDES in the script to fix, then re-run.\n`,
    );
  }
}

// ---------------------------------------------------------------------------
// 0003 generator: geom UPDATEs + centroid batch
// ---------------------------------------------------------------------------

function generate0003(
  provinceFeatures: GeoJSONFeature[],
  districtFeatures: GeoJSONFeature[],
  provinceMap: Map<string, string>,
): void {
  const lines: string[] = [
    `-- Generated by scripts/generate-location-sql.ts`,
    `-- Source: GADM v4.1 Turkey level-1 (provinces) and level-2 (districts)`,
    `-- DO NOT EDIT MANUALLY — re-run the generator to regenerate`,
    `--`,
    `-- Geometry notes:`,
    `-- • Coordinates are pre-rounded to 5 decimal places (~1 m precision).`,
    `-- • ST_SimplifyPreserveTopology(tolerance=0.01°, ~1 km) further reduces`,
    `--   stored vertex count without breaking polygon topology.`,
    `-- • center = ST_Centroid(geom) is derived automatically at the end.`,
    ``,
    `-- Province polygons`,
  ];

  const provinceUnmatched = new Set<string>();
  let provinceCount = 0;

  for (const feature of provinceFeatures) {
    if (!feature.geometry) continue;
    const gadmName = feature.properties?.["NAME_1"];
    if (typeof gadmName !== "string") continue;

    const dbName = provinceMap.get(gadmName);
    if (!dbName) {
      provinceUnmatched.add(gadmName);
      continue;
    }

    const geomExpr = toPostGISExpr(feature.geometry);
    lines.push(`UPDATE locations SET geom = ${geomExpr}`);
    lines.push(`WHERE name_en = '${escapeSql(dbName)}' AND level = 'province';`);
    provinceCount++;
  }

  lines.push(``);
  lines.push(`-- District polygons`);

  const districtUnmatched = new Set<string>();
  let districtCount = 0;

  for (const feature of districtFeatures) {
    if (!feature.geometry) continue;
    const gadmProvince = feature.properties?.["NAME_1"];
    const gadmDistrict = feature.properties?.["NAME_2"];
    if (typeof gadmProvince !== "string" || typeof gadmDistrict !== "string")
      continue;

    const dbProvinceName = provinceMap.get(gadmProvince);
    if (!dbProvinceName) {
      districtUnmatched.add(gadmProvince);
      continue;
    }

    const nameEn = transliterate(gadmDistrict);
    const geomExpr = toPostGISExpr(feature.geometry);

    lines.push(`UPDATE locations SET geom = ${geomExpr}`);
    lines.push(`WHERE name_en = '${escapeSql(nameEn)}' AND level = 'district'`);
    lines.push(
      `  AND parent_id = (SELECT id FROM locations WHERE name_en = '${escapeSql(dbProvinceName)}' AND level = 'province');`,
    );
    districtCount++;
  }

  lines.push(``);
  lines.push(`-- Derive center points from polygon centroids (provinces + districts)`);
  lines.push(`-- center is always computed, never hand-authored.`);
  lines.push(`UPDATE locations`);
  lines.push(`SET center = ST_Centroid(geom)::geometry(Point, 4326)`);
  lines.push(`WHERE geom IS NOT NULL;`);
  lines.push(``);

  writeFileSync(OUT_0003, lines.join("\n") + "\n");
  console.log(
    `0003: wrote ${provinceCount} province + ${districtCount} district geometry UPDATE statements`,
  );

  for (const name of provinceUnmatched) {
    console.warn(
      `  Province geometry skipped: "${name}" → "${transliterate(name)}"`,
    );
  }
}

// ---------------------------------------------------------------------------
// Journal updater
// ---------------------------------------------------------------------------

function updateJournal(): void {
  const journal: Journal = JSON.parse(readFileSync(JOURNAL_PATH, "utf-8"));
  const existingTags = new Set(journal.entries.map((e) => e.tag));
  let updated = false;

  const toAdd: JournalEntry[] = [
    {
      idx: 2,
      version: "7",
      when: 0,
      tag: "0002_location_districts",
      breakpoints: false,
    },
    {
      idx: 3,
      version: "7",
      when: 0,
      tag: "0003_location_geometry",
      breakpoints: false,
    },
  ];

  for (const entry of toAdd) {
    if (!existingTags.has(entry.tag)) {
      journal.entries.push(entry);
      updated = true;
    }
  }

  if (updated) {
    writeFileSync(JOURNAL_PATH, JSON.stringify(journal, null, 2) + "\n");
    console.log(`_journal.json: added entries for 0002 and 0003`);
  } else {
    console.log(`_journal.json: entries already present, skipped`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  let hasError = false;

  if (!existsSync(GADM_L1_PATH)) {
    console.error(`❌  Missing: ${GADM_L1_PATH}`);
    hasError = true;
  }
  if (!existsSync(GADM_L2_PATH)) {
    console.error(`❌  Missing: ${GADM_L2_PATH}`);
    hasError = true;
  }
  if (hasError) {
    console.error(`\nDownload GADM v4.1 Turkey GeoJSON:`);
    console.error(
      `  https://gadm.org/download_country.html → Turkey → GeoJSON → Level 1`,
    );
    console.error(
      `  https://gadm.org/download_country.html → Turkey → GeoJSON → Level 2`,
    );
    console.error(`\nPlace files at:`);
    console.error(`  scripts/data/gadm41_TUR_1.json`);
    console.error(`  scripts/data/gadm41_TUR_2.json`);
    process.exit(1);
  }

  console.log(`Reading GADM level-1 (provinces) ...`);
  const l1: GeoJSONFeatureCollection = JSON.parse(
    readFileSync(GADM_L1_PATH, "utf-8"),
  );

  console.log(`Reading GADM level-2 (districts) ...`);
  const l2: GeoJSONFeatureCollection = JSON.parse(
    readFileSync(GADM_L2_PATH, "utf-8"),
  );

  console.log(
    `  Found ${l1.features.length} provinces, ${l2.features.length} districts\n`,
  );

  // Build province lookup: GADM NAME_1 → DB name_en
  const provinceMap = new Map<string, string>();
  for (const feature of l1.features) {
    const gadmName = feature.properties?.["NAME_1"];
    if (typeof gadmName !== "string") continue;
    const transliterated = transliterate(gadmName);
    const dbName = PROVINCE_OVERRIDES[transliterated] ?? transliterated;
    provinceMap.set(gadmName, dbName);
  }

  generate0002(l2.features, provinceMap);
  generate0003(l1.features, l2.features, provinceMap);
  updateJournal();

  console.log(`\n✅  Done!`);
  console.log(`  ${OUT_0002}`);
  console.log(`  ${OUT_0003}`);
  console.log(`\nApply with: just api dev`);
  console.log(
    `  (runMigrations() picks up 0002 and 0003 automatically on startup)`,
  );
}

main();
