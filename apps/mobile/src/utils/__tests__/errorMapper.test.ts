import { getErrorMessageKey } from '../errorMapper';

describe('ErrorMapper Util', () => {
  it('maps known error codes to i18n keys', () => {
    expect(getErrorMessageKey('UNAUTHORIZED')).toBe('error.auth.unauthorized');
    expect(getErrorMessageKey('NOT_FOUND')).toBe('error.generic.not_found');
    expect(getErrorMessageKey('INTERNAL')).toBe('error.generic.internal_error');
    expect(getErrorMessageKey('RATE_LIMITED')).toBe(
      'error.rate_limit.try_again_shortly',
    );
  });

  it('handles validation error with field', () => {
    expect(getErrorMessageKey('VALIDATION', 'email')).toBe(
      'error.validation.email',
    );
  });

  it('handles validation error without field', () => {
    expect(getErrorMessageKey('VALIDATION')).toBe(
      'error.generic.validation_failed',
    );
  });

  it('returns unknown for unknown error codes', () => {
    expect(
      getErrorMessageKey(
        'UNKNOWN_CODE' as Parameters<typeof getErrorMessageKey>[0],
      ),
    ).toBe('error.generic.unknown');
  });
});
