/**
 * Centralized configuration constants.
 * Design tokens (spacing, fonts, colors) are managed via Unistyles (src/theme/).
 */

import { Dimensions } from 'react-native';

const DEFAULT_WINDOW_WIDTH = 375;
const DEFAULT_WINDOW_HEIGHT = 812;

const { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT } = Dimensions.get(
  'window',
) || { width: DEFAULT_WINDOW_WIDTH, height: DEFAULT_WINDOW_HEIGHT };

/**
 * Application-wide configuration object.
 */
export const Config = {
  app: {
    NAME: 'Patty',
  },

  api: {
    BASE_URL:
      process.env.EXPO_PUBLIC_BASE_URL ?? 'http://localhost:8080/api/v1/',
    TIMEOUT: 10000,
  },

  animation: {
    duration: {
      fast: 100,
      regular: 300,
      moderate: 400,
      medium: 500,
      leisurely: 800,
      slow: 1200,
      crawl: 2000,
    },
    delay: {
      stagger: 100,
      short: 200,
      medium: 300,
      normal: 500,
      long: 800,
    },
    spring: {
      responsive: { damping: 15, stiffness: 400 },
      default: { damping: 20, stiffness: 200 },
      smooth: { damping: 25, stiffness: 150 },
    },
  },

  websocket: {
    maxReconnectAttempts: 5,
    reconnectBaseDelayMs: 1000,
  },

  image: {
    defaultQuality: 0.8,
    defaultAspectRatio: [1, 1] as const,
  },

  constants: {
    WINDOW_HEIGHT: DEFAULT_HEIGHT,
    WINDOW_WIDTH: DEFAULT_WIDTH,
  },
};
