import { mapApiError } from 'src/api/errors';
import { logger } from 'src/utils/logger';
import type { z } from 'zod';

/**
 * Minimal interface for API responses to avoid platform-specific type conflicts
 * (e.g., FormData differences between React Native and Hono).
 */
export interface BaseResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly url: string;
  json(): Promise<unknown>;
}

/**
 * Base class for all services providing standardized API response handling and validation.
 */
export class BaseService {
  /**
   * Standardized handler for void API responses (e.g. 204 No Content).
   */
  protected static handle(response: BaseResponse): Promise<void>;
  /**
   * Standardized handler for API responses with runtime Zod validation.
   */
  protected static handle<T>(
    response: BaseResponse,
    schema: z.ZodType<T>,
  ): Promise<T>;
  protected static async handle<T>(
    response: BaseResponse,
    schema?: z.ZodType<T>,
  ): Promise<T | void> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => undefined);
      throw mapApiError(errorData);
    }

    // 204 No Content — callers declare return type void; no value to return.
    if (response.status === 204 || !schema) {
      return;
    }

    const data = await response.json();
    const result = schema.safeParse(data);

    if (!result.success) {
      logger.error('Runtime Validation Failed', {
        status: response.status,
        url: response.url,
        error: result.error,
      });

      if (__DEV__) {
        logger.error('Data Integrity Error', {
          error: result.error,
          data,
        });
      }

      // Unexpected schema mismatch — throw so React Query surfaces the error
      // rather than silently returning wrong-typed data.
      throw result.error;
    }

    return result.data;
  }
}
