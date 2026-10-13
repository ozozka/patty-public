/**
 * Robust encoding and decoding utilities.
 * Handles platform differences and provides safety against malformed data.
 */

import { decode as b64Decode } from 'base-64';

import { logger } from './logger';

export const Encoding = {
  /**
   * Safely decodes a Base64 string, handling UTF-8 and Base64Url variants.
   */
  atob(input: string): string {
    // Convert Base64Url to standard Base64
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    return b64Decode(base64);
  },

  /**
   * Safely decodes a JWT payload.
   */
  decodeJwtPayload<T = unknown>(token: string): T | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const base64Payload = parts[1];
      if (!base64Payload) return null;

      const binaryPayload = this.atob(base64Payload);

      // Handle multi-byte characters
      const jsonPayload = decodeURIComponent(
        binaryPayload
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );

      // JSON.parse returns `any`, which TypeScript allows assigning to T without a cast.
      return JSON.parse(jsonPayload);
    } catch (error) {
      logger.error('Failed to decode JWT payload', { error });
      return null;
    }
  },

  /**
   * Check if a JWT token is expired.
   * Returns true if token is invalid, missing exp claim, or within 30 seconds of expiry.
   */
  isTokenExpired(token: string): boolean {
    const payload = this.decodeJwtPayload<{ exp?: number }>(token);
    if (!payload?.exp) return true;
    // Consider expired if less than 30 seconds remaining
    return payload.exp * 1000 < Date.now() + 30000;
  },
};
