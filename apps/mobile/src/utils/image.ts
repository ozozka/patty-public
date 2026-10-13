/**
 * Cloudinary image URL utilities for optimized image delivery.
 */

export interface ImageOptimizationOptions {
  /** Target width in pixels */
  width?: number;
  /** Target height in pixels */
  height?: number;
  /** Crop mode: 'cover', 'contain', 'fill', 'scale', 'crop', 'thumb' */
  crop?: 'cover' | 'contain' | 'fill' | 'scale' | 'crop' | 'thumb';
  /** Quality: 'auto' or number 0-100 */
  quality?: 'auto' | number;
  /** Format: 'auto', 'webp', 'avif', 'jpg', 'png' */
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
}

const DEFAULT_OPTIONS: ImageOptimizationOptions = {
  width: 400,
  height: 533,
  crop: 'cover',
  quality: 'auto',
  format: 'auto',
};

function isCloudinaryUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  return url.includes('res.cloudinary.com') && url.includes('/image/upload/');
}

function buildTransformString(options: ImageOptimizationOptions): string {
  const parts: string[] = [];

  if (options.width) parts.push(`w_${options.width}`);
  if (options.height) parts.push(`h_${options.height}`);
  if (options.crop) parts.push(`c_${options.crop}`);
  if (options.quality) {
    parts.push(`q_${options.quality}`);
  }
  if (options.format) {
    parts.push(`f_${options.format}`);
  }

  return parts.join(',');
}

/**
 * Optimizes a Cloudinary image URL with transformation parameters.
 *
 * @param url - The original Cloudinary image URL
 * @param options - Optimization options (width, height, crop, quality, format)
 * @returns Optimized URL or original if not a Cloudinary URL
 *
 * @example
 * // Basic optimization (400x533 cover)
 * optimizeImageUrl('https://res.cloudinary.com/pati/image/upload/v1/pet/photo.jpg')
 * // => 'https://res.cloudinary.com/pati/image/upload/w_400,h_533,c_fill,q_auto,f_auto/v1/pet/photo.jpg'
 */
export function optimizeImageUrl(
  url: string | null | undefined,
  options: ImageOptimizationOptions = DEFAULT_OPTIONS,
): string | null {
  if (!isCloudinaryUrl(url)) {
    return url ?? null;
  }

  const transformed = buildTransformString(options);
  if (!transformed) {
    return url ?? null;
  }

  const separator = '/upload/';
  const index = url.indexOf(separator);
  if (index === -1) {
    return url;
  }

  const base = url.slice(0, index + separator.length);
  const path = url.slice(index + separator.length);

  return `${base}${transformed}/${path}`;
}

/**
 * Creates a thumbnail-optimized URL (150x150)
 */
export function optimizeThumbnailUrl(
  url: string | null | undefined,
): string | null {
  return optimizeImageUrl(url, {
    width: 150,
    height: 150,
    crop: 'fill',
  });
}

/**
 * Creates a card-optimized URL for discovery/profile (800x1066 - 3:4 ratio)
 */
export function optimizeCardUrl(url: string | null | undefined): string | null {
  return optimizeImageUrl(url, {
    width: 800,
    height: 1066,
    crop: 'cover',
  });
}

/**
 * Creates an avatar-optimized URL (200x200 circular)
 */
export function optimizeAvatarUrl(
  url: string | null | undefined,
): string | null {
  return optimizeImageUrl(url, {
    width: 200,
    height: 200,
    crop: 'fill',
  });
}

/**
 * Optimizes an array of URLs (e.g., for pet photo galleries)
 */
export function optimizeImageUrls(
  urls: (string | null | undefined)[],
  options: ImageOptimizationOptions = DEFAULT_OPTIONS,
): (string | null)[] {
  return urls.map((url) => optimizeImageUrl(url, options));
}
