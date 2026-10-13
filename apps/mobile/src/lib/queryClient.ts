import { QueryClient } from '@tanstack/react-query';
const ONE_MINUTE = 1000 * 60;
const THIRTY_MINUTES = ONE_MINUTE * 30;

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (!(error && typeof error === 'object' && 'error' in error)) {
    return failureCount < 2;
  }
  // TypeScript narrows `error` to `object & { error: unknown }` here
  const errorCode = error.error;
  if (
    errorCode === 'UNAUTHORIZED' ||
    errorCode === 'FORBIDDEN' ||
    errorCode === 'NOT_FOUND'
  ) {
    return false;
  }
  return failureCount < 2;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: ONE_MINUTE * 5,
      gcTime: THIRTY_MINUTES,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});
