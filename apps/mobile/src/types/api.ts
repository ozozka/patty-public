/** Source file for api. */
import type { ErrorCode, ErrorResponse } from '@patty/contracts';

/**
 * Backend error codes — re-exported from contracts for convenience.
 * Mobile-only synthetic codes are added for client-side error classification.
 */
export type BackendErrorCode = ErrorCode;

/**
 * Client-side synthetic error codes for non-server errors.
 */
export type ClientErrorCode = 'TIMEOUT' | 'NETWORK_ERROR';

/**
 * Combined error code type for mobile error handling.
 */
export type ApiErrorCode = BackendErrorCode | ClientErrorCode;

/**
 * Standardized backend error response structure.
 */
export interface ApiError extends Omit<ErrorResponse, 'error'> {
  error: ApiErrorCode;
}

/**
 * Standard API response structure.
 */
export interface ApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  json?: T;
  error?: ApiError;
  err?: unknown;
  timeout?: boolean;
}
