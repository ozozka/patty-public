/**
 * SVG → PNG asset generation pipeline.
 *
 * Reads SVG sources from src/logo/, renders them to PNG at required sizes,
 * and copies outputs to the app directories that need them.
 *
 * Run via: bun scripts/generate-raster.ts
 */

import { existsSync, mkdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import { Resvg } from "@resvg/resvg-js";

const ROOT = resolve(import.meta.dirname, "..");
const MONOREPO_ROOT = resolve(ROOT, "../..");
const SRC_DIR = join(ROOT, "src/logo");
const GEN_DIR = join(ROOT, "generated");

const WEB_PUBLIC = join(MONOREPO_ROOT, "apps/web/public");
const MOBILE_ASSETS = join(MONOREPO_ROOT, "apps/mobile/assets");

interface RasterTarget {
  /** Source SVG filename (without extension) */
  source: string;
  /** Output PNG filename */
  output: string;
  /** Pixel width & height */
  size: number;
  /** Destination directories to copy to (in addition to generated/) */
  copyTo?: string[];
}

const targets: RasterTarget[] = [
  // Mobile app icon (1024×1024)
  {
    source: "logo",
    output: "icon.png",
    size: 1024,
    copyTo: [MOBILE_ASSETS],
  },
  // Android adaptive icon foreground (1024×1024)
  {
    source: "logo",
    output: "adaptive-icon.png",
    size: 1024,
    copyTo: [MOBILE_ASSETS],
  },
  // Expo splash screen icon (2000×2000)
  {
    source: "logo",
    output: "splash-icon.png",
    size: 2000,
    copyTo: [MOBILE_ASSETS],
  },
  // Favicon (32×32)
  {
    source: "logo",
    output: "favicon.png",
    size: 32,
    copyTo: [WEB_PUBLIC, MOBILE_ASSETS],
  },
  // Web og/fallback (512×512)
  {
    source: "logo",
    output: "logo.png",
    size: 512,
    copyTo: [WEB_PUBLIC],
  },
];

/** SVG files to copy as-is to destination directories */
const svgCopies: Array<{ source: string; destinations: string[] }> = [
  { source: "logo.svg", destinations: [WEB_PUBLIC, MOBILE_ASSETS] },
  { source: "logo-dark.svg", destinations: [WEB_PUBLIC] },
  { source: "logo-mono.svg", destinations: [WEB_PUBLIC] },
];

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

async function renderSvgToPng(
  svgPath: string,
  size: number,
): Promise<Uint8Array> {
  const svgContent = await Bun.file(svgPath).text();
  const resvg = new Resvg(svgContent, {
    fitTo: { mode: "width", value: size },
    background: "rgba(0, 0, 0, 0)",
  });
  const rendered = resvg.render();
  return rendered.asPng();
}

async function main() {
  ensureDir(GEN_DIR);

  console.log("Generating raster assets from SVG sources...\n");

  // Generate PNGs
  for (const target of targets) {
    const svgPath = join(SRC_DIR, `${target.source}.svg`);
    const outputPath = join(GEN_DIR, target.output);

    if (!existsSync(svgPath)) {
      console.warn(`  SKIP ${target.output} — source ${target.source}.svg not found`);
      continue;
    }

    const pngData = await renderSvgToPng(svgPath, target.size);
    await Bun.write(outputPath, pngData);
    console.log(`  ${target.output} (${target.size}×${target.size})`);

    // Copy to destination directories
    if (target.copyTo) {
      for (const dest of target.copyTo) {
        ensureDir(dest);
        const destPath = join(dest, target.output);
        await Bun.write(destPath, pngData);
      }
    }
  }

  // Copy SVGs as-is
  console.log("\nCopying SVG sources...\n");
  for (const copy of svgCopies) {
    const srcPath = join(SRC_DIR, copy.source);
    if (!existsSync(srcPath)) {
      console.warn(`  SKIP ${copy.source} — not found`);
      continue;
    }

    const content = await Bun.file(srcPath).text();
    for (const dest of copy.destinations) {
      ensureDir(dest);
      await Bun.write(join(dest, basename(copy.source)), content);
    }
    console.log(`  ${copy.source} → ${copy.destinations.map((d) => d.replace(MONOREPO_ROOT + "/", "")).join(", ")}`);
  }

  console.log("\nDone.");
}

void main();
