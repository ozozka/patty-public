/**
 * Theme type definitions.
 */

export interface ThemeColors {
  PRIMARY: string;
  SECONDARY: string;
  ERROR: string;
  SUCCESS: string;
  GRAY: string;
  TEXT: string;
  TEXT_SECONDARY: string;
  TEXT_MUTED: string;
  TEXT_ON_IMAGE: string;
  BACKGROUND: string;
  COMPONENT: string;
  SURFACE: string;
  SURFACE_ELEVATED: string;
  SURFACE_SUNKEN: string;
  BORDER: string;
  BORDER_LIGHT: string;
  ON_PRIMARY: string;
  OVERLAY: string;
  GRADIENT_CARD_OVERLAY: readonly [string, string, ...string[]];
  GRADIENT_HEADER: readonly [string, string, ...string[]];
  GENDER_MALE: string;
  GENDER_FEMALE: string;
  GENDER_OTHER: string;
  SWIPE_LIKE: string;
  SWIPE_PASS: string;
  SWIPE_LIKE_SUBTLE: string;
  SWIPE_PASS_SUBTLE: string;
  SUPER_LIKE_SUBTLE: string;
  DIVIDER: string;
  TRANSPARENT_CARD: string;
  TRANSPARENT_INPUT: string;
  TRANSPARENT_TAB_BAR: string;
  TRANSPARENT_MODAL: string;
  TRANSPARENT_TOAST: string;
  TRANSPARENT_IMAGE_VIEWER: string;
}
