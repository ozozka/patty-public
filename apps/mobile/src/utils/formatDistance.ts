/**
 * Formats a distance in meters to a human-readable string.
 * Shows meters when under 1km, otherwise shows kilometers with one decimal.
 */
export function formatDistance(
  distanceM: number | null | undefined,
): string | null {
  if (distanceM == null) return null;

  if (distanceM < 1000) {
    return `${Math.round(distanceM)}m`;
  }

  return `${(distanceM / 1000).toFixed(1)}km`;
}
