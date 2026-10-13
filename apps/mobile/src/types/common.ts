/** Common type definitions shared across the mobile app. */
export type ThemeType = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // ─── Brand ─────────────────────────────────────────────────────
  PRIMARY: string;
  SECONDARY: string;
  ERROR: string;
  SUCCESS: string;

  // ─── Neutral ────────────────────────────────────────────────────
  /** Neutral gray for icons, placeholders, inactive elements */
  GRAY: string;

  // ─── Text ──────────────────────────────────────────────────────
  /** Primary text — headings, body copy (Gray 800 / Zinc 50) */
  TEXT: string;
  /** Secondary text — subtitles, descriptions (Gray 600 / Balanced Gray) */
  TEXT_SECONDARY: string;
  /** Muted text — placeholders, timestamps, captions (Gray 400 / Muted Zinc) */
  TEXT_MUTED: string;
  /** Text rendered on top of images with gradient overlay */
  TEXT_ON_IMAGE: string;

  // ─── Surfaces ──────────────────────────────────────────────────
  BACKGROUND: string;
  /** Subtle input/component surface (between BACKGROUND and SURFACE) */
  COMPONENT: string;
  /** Standard card/container surface */
  SURFACE: string;
  /** Elevated surface — modals, popovers, incoming chat bubbles */
  SURFACE_ELEVATED: string;
  /** Recessed surface — input backgrounds, empty states, settings sections */
  SURFACE_SUNKEN: string;

  // ─── Borders ───────────────────────────────────────────────────
  BORDER: string;
  /** Subtle border for tab bars and chat input separators */
  BORDER_LIGHT: string;

  // ─── Interactive ───────────────────────────────────────────────
  /** Text/icon color rendered on PRIMARY background */
  ON_PRIMARY: string;
  OVERLAY: string;

  // ─── Gradients ─────────────────────────────────────────────────
  GRADIENT_CARD_OVERLAY: readonly [string, string, ...string[]];
  GRADIENT_HEADER: readonly [string, string, ...string[]];

  // ─── Gender ────────────────────────────────────────────────────
  GENDER_MALE: string;
  GENDER_FEMALE: string;
  GENDER_OTHER: string;

  // ─── Swipe ─────────────────────────────────────────────────────
  SWIPE_LIKE: string;
  SWIPE_PASS: string;
  SWIPE_LIKE_SUBTLE: string;
  SWIPE_PASS_SUBTLE: string;
  /** Amber tint for super like action border */
  SUPER_LIKE_SUBTLE: string;

  // ─── Misc ──────────────────────────────────────────────────────
  DIVIDER: string;

  // ─── Transparency (glass/blur effects) ─────────────────────────
  TRANSPARENT_CARD: string;
  TRANSPARENT_INPUT: string;
  TRANSPARENT_TAB_BAR: string;
  TRANSPARENT_MODAL: string;
  TRANSPARENT_TOAST: string;
  /** Full-screen image viewer backdrop */
  TRANSPARENT_IMAGE_VIEWER: string;
}
