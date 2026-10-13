/**
 * Token validation utilities.
 * Storage is handled exclusively by Zustand persist (SecureStore key: auth-storage).
 */

import { Encoding } from './encoding';

export const tokenManager = {
  /**
   * Check if a token is valid (present, proper format, not expired).
   */
  isValid(token: string | null): token is string {
    if (!token) return false;
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    return !Encoding.isTokenExpired(token);
  },
};
