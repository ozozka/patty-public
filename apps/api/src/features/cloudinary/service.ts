import { env } from "@patty/api/env";
import { AppError } from "@patty/api/lib/errors";
import { logger } from "@patty/api/lib/logger";
import { createHash } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CloudinarySignature {
  signature: string;
  timestamp: number;
  api_key: string;
  cloud_name: string;
  public_id: string;
  folder: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ImageFolder = "user_profile" | "pet_profile" | "chat_images";

export function resolveFolder(imageType: string): ImageFolder {
  if (
    imageType === "user" ||
    imageType === "user_profile" ||
    imageType === "avatars"
  ) {
    return "user_profile";
  }
  if (
    imageType === "pet" ||
    imageType === "pet_profile" ||
    imageType === "pet_images"
  ) {
    return "pet_profile";
  }
  if (imageType === "chat" || imageType === "message") {
    return "chat_images";
  }
  throw AppError.validation("INVALID_IMAGE_TYPE");
}

function sha1Hex(data: string): string {
  return createHash("sha1").update(data).digest("hex");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates a Cloudinary signed upload signature for client-side uploads.
 * Parameters are sorted alphabetically to match Cloudinary's signing requirements.
 */
export function generateSignature(
  imageType: string,
  entityId: string,
): CloudinarySignature {
  const folder = resolveFolder(imageType);
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `${entityId}_${String(timestamp)}`;

  const paramString = `folder=${folder}&public_id=${publicId}&timestamp=${String(timestamp)}${env.CLOUDINARY_API_SECRET}`;
  const signature = sha1Hex(paramString);

  return {
    signature,
    timestamp,
    api_key: env.CLOUDINARY_API_KEY,
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    public_id: publicId,
    folder,
  };
}

/**
 * Deletes an image from Cloudinary by public_id.
 * Failures are swallowed (best-effort cleanup).
 */
export async function deleteImage(publicId: string): Promise<void> {
  const timestamp = Math.floor(Date.now() / 1000);
  const paramString = `public_id=${publicId}&timestamp=${String(timestamp)}${env.CLOUDINARY_API_SECRET}`;
  const signature = sha1Hex(paramString);

  const url = `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/destroy`;
  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: env.CLOUDINARY_API_KEY,
    signature,
  });

  const res = await fetch(url, { method: "POST", body });
  if (!res.ok) {
    // Log but don't throw — cleanup failures should not block the user flow.
    logger.error({ publicId, status: res.status }, "Cloudinary delete failed");
  }
}

/**
 * Extracts the Cloudinary public_id from a full image URL.
 * Returns null if the URL is not a Cloudinary URL.
 */
export function extractPublicId(url: string): string | null {
  if (!url.includes("res.cloudinary.com")) return null;
  const parts = url.split("/upload/");
  if (parts.length < 2) return null;
  const afterUpload = parts[1] ?? "";
  const segments = afterUpload.split("/");
  // Skip version segment (starts with 'v' followed by digits)
  const startIndex = /^v\d+$/.test(segments[0] ?? "") ? 1 : 0;
  const withExt = segments.slice(startIndex).join("/");
  const dotIndex = withExt.lastIndexOf(".");
  return dotIndex !== -1 ? withExt.slice(0, dotIndex) : withExt;
}

/** Best-effort cleanup of an old Cloudinary image when it is replaced or removed. */
export async function cleanupImage(oldUrl: string | null): Promise<void> {
  if (!oldUrl) return;
  const publicId = extractPublicId(oldUrl);
  if (publicId) await deleteImage(publicId);
}
