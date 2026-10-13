/**
 * Error mapping utilities for openapi-fetch responses.
 *
 * Maps raw API error payloads (typed as unknown from openapi-fetch)
 * to the app-wide ApiError interface so hooks and UI work unchanged.
 */
import { errorCodeSchema } from '@patty/contracts';
import type { ApiError, ApiErrorCode } from 'src/types/api';

function isBackendErrorCode(value: unknown): value is ApiErrorCode {
  return errorCodeSchema.safeParse(value).success;
}

function isFieldErrors(value: unknown): value is Record<string, string[]> {
  if (value === null || value === undefined || typeof value !== 'object') {
    return false;
  }
  return Object.values(value).every(
    (v) => Array.isArray(v) && v.every((s) => typeof s === 'string'),
  );
}

/**
 * Map an openapi-fetch error payload to the app-wide ApiError interface.
 *
 * The `error` argument may be `undefined` for endpoints where the OpenAPI spec
 * doesn't define an error response body — the fallback is INTERNAL.
 */
export function mapApiError(error: unknown): ApiError {
  if (
    error !== null &&
    error !== undefined &&
    typeof error === 'object' &&
    'error' in error &&
    'message' in error
  ) {
    // TypeScript narrows `error` here to `object & { error: unknown } & { message: unknown }`
    // because of the `'error' in error && 'message' in error` guards above.
    const errorField: unknown = error.error;
    const messageField: unknown = error.message;
    const contextField: unknown =
      'context' in error ? error.context : undefined;
    const fieldErrorsField: unknown =
      'field_errors' in error ? error.field_errors : undefined;
    const code = isBackendErrorCode(errorField) ? errorField : 'INTERNAL';
    return {
      error: code,
      message:
        typeof messageField === 'string'
          ? messageField
          : 'An unknown error occurred',
      context: typeof contextField === 'string' ? contextField : undefined,
      field_errors: isFieldErrors(fieldErrorsField)
        ? fieldErrorsField
        : undefined,
    };
  }

  return {
    error: 'INTERNAL',
    message: 'An unknown error occurred',
  };
}
