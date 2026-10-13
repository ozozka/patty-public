/**
 * Utility to map backend error codes to i18n translation keys.
 */

import type { ParseKeys } from 'i18next';
import type { ApiErrorCode } from 'src/types/api';

const ERROR_CODE_MAPPING: Record<ApiErrorCode, ParseKeys> = {
  UNAUTHORIZED: 'error.auth.unauthorized',
  FORBIDDEN: 'error.generic.forbidden',
  NOT_FOUND: 'error.generic.not_found',
  VALIDATION: 'error.generic.validation_failed',
  CONFLICT: 'error.generic.conflict',
  INTERNAL: 'error.generic.internal_error',
  RATE_LIMITED: 'error.rate_limit.try_again_shortly',
  GONE: 'error.generic.not_found',
  TIMEOUT: 'error.network.timeout',
  NETWORK_ERROR: 'error.network.connection_failed',
};

/**
 * Maps an error code to an i18n key.
 * @param code The error code from the backend or client.
 * @param field Optional field name for validation errors.
 */
export function getErrorMessageKey(code: ApiErrorCode, field?: string): string {
  if (code === 'VALIDATION' && field) {
    return `error.validation.${field}`;
  }

  const key: ParseKeys | undefined = ERROR_CODE_MAPPING[code];
  return key ?? 'error.generic.unknown';
}
