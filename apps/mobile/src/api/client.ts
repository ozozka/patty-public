/**
 * Typed HTTP client for the Patty backend.
 *
 * Wraps hono/client with:
 *   - JWT auth injection
 *   - Timeout (Config.api.TIMEOUT)
 *   - Retry with exponential back-off (3 attempts, network/abort errors only)
 *   - 401 handling: attempts token refresh, then deauthenticates on failure
 */
import type { AppType } from '@patty/api/types';
import { hc } from 'hono/client';
import { Config } from 'src/Config';
import { useAuthStore } from 'src/store/useAuthStore';
import { logger } from 'src/utils/logger';

import { getClientToken } from './token';

// Shared in-flight refresh promise so concurrent 401s all wait on the same attempt.
let refreshPromise: Promise<boolean> | null = null;

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms);
    // Allow Node.js process to exit while the timer is pending (no-op in Hermes).
    if (t.unref) {
      t.unref();
    }
  });
}

async function doRefreshToken(): Promise<boolean> {
  try {
    const { refreshToken, updateTokens } = useAuthStore.getState();
    if (!refreshToken) return false;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Config.api.TIMEOUT);
    if (timer.unref) timer.unref();

    // Use raw fetch to avoid recursion through fetchWithRetry
    const response = await fetch(`${Config.api.BASE_URL}auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!response.ok) return false;

    const json: unknown = await response.json();
    if (
      json === null ||
      typeof json !== 'object' ||
      !('token' in json) ||
      !('refresh_token' in json)
    ) {
      return false;
    }
    // TypeScript narrows json to `object & { token: unknown } & { refresh_token: unknown }` here
    const token: unknown = json.token;
    const newRefreshToken: unknown = json.refresh_token;
    if (typeof token !== 'string' || typeof newRefreshToken !== 'string') {
      return false;
    }
    updateTokens(token, newRefreshToken);
    return true;
  } catch (error) {
    logger.error('Token refresh failed', { error });
    return false;
  }
}

async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = doRefreshToken().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  retries = 3,
  delay = 1000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Config.api.TIMEOUT);
  if (timer.unref) {
    timer.unref();
  }

  // Inject the authorization token dynamically for every request
  const token = getClientToken();
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const enhancedInit: RequestInit = {
    ...init,
    headers,
    signal: controller.signal,
  };

  try {
    const response = await fetch(input, enhancedInit);
    clearTimeout(timer);

    // Handle 401 Unauthorized — try refreshing the token
    if (response.status === 401) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        // Retry the original request with new token
        return fetchWithRetry(input, init, 0, delay);
      }
      // Refresh failed — deauthenticate
      useAuthStore.getState().deauthenticate();
    }

    return response;
  } catch (error: unknown) {
    clearTimeout(timer);

    const errName = error instanceof Error ? error.name : String(error);
    const errMessage = error instanceof Error ? error.message : '';
    const isAbort = errName === 'AbortError';
    const isNetwork = errMessage === 'Network request failed';

    if ((isAbort || isNetwork) && retries > 0) {
      logger.info(
        `Request failed (${errName}). Retrying in ${delay}ms… (${retries} left)`,
      );
      await sleep(delay);
      return fetchWithRetry(input, init, retries - 1, delay * 2);
    }

    throw error;
  }
}

// Instantiate the client using the API origin.
// Access will be via apiClient.api.v1...
const API_ORIGIN = Config.api.BASE_URL.split('/api/v1/')[0] ?? '';

export const apiClient = hc<AppType>(API_ORIGIN, { fetch: fetchWithRetry });
