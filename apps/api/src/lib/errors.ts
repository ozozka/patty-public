import type { ErrorCode } from "@patty/contracts";

export type { ErrorCode };

export type AppErrorStatus = 401 | 403 | 404 | 409 | 410 | 422 | 429 | 500;

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: AppErrorStatus;
  readonly fieldErrors?: Record<string, string[]>;
  readonly context?: string;

  constructor(
    code: ErrorCode,
    status: AppErrorStatus,
    message: string,
    options?: { fieldErrors?: Record<string, string[]>; context?: string },
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.fieldErrors = options?.fieldErrors;
    this.context = options?.context;
  }

  static unauthorized(message = "Unauthorized"): AppError {
    return new AppError("UNAUTHORIZED", 401, message);
  }

  static forbidden(message = "Forbidden"): AppError {
    return new AppError("FORBIDDEN", 403, message);
  }

  static notFound(message = "Not found"): AppError {
    return new AppError("NOT_FOUND", 404, message);
  }

  static conflict(message: string): AppError {
    return new AppError("CONFLICT", 409, message);
  }

  static validation(
    message: string,
    fieldErrors?: Record<string, string[]>,
  ): AppError {
    return new AppError("VALIDATION", 422, message, { fieldErrors });
  }

  static internal(message = "Internal server error"): AppError {
    return new AppError("INTERNAL", 500, message);
  }

  static rateLimited(message = "Rate limit exceeded"): AppError {
    return new AppError("RATE_LIMITED", 429, message);
  }

  static gone(message: string): AppError {
    return new AppError("GONE", 410, message);
  }
}
