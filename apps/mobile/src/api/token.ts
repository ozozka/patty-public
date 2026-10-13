/**
 * Shared token management for the API client.
 * Isolated to avoid circular dependencies between Client, Store, and Services.
 */

let tokenGetter: (() => string | null) | undefined;

/**
 * Register a function to retrieve the authentication token.
 */
export function setClientTokenGetter(getter: () => string | null): void {
  tokenGetter = getter;
}

/**
 * Get the current token via the registered getter.
 */
export function getClientToken(): string | null {
  return tokenGetter?.() ?? null;
}
