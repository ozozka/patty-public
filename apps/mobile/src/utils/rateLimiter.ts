/**
 * Simple client-side rate limiter for preventing spam on auth operations.
 */

export class RateLimiter {
  private lastAttempt = 0;

  constructor(private minDelayMs: number) {}

  /**
   * Check if an attempt is allowed.
   * Returns true if enough time has passed since the last attempt.
   */
  canAttempt(): boolean {
    const now = Date.now();
    if (now - this.lastAttempt < this.minDelayMs) {
      return false;
    }
    this.lastAttempt = now;
    return true;
  }

  /**
   * Get milliseconds remaining until next attempt is allowed.
   */
  getRemainingMs(): number {
    return Math.max(0, this.minDelayMs - (Date.now() - this.lastAttempt));
  }

  /**
   * Reset the rate limiter.
   */
  reset(): void {
    this.lastAttempt = 0;
  }
}

/**
 * Factory functions for pre-configured rate limiters.
 * Use with useRef in hooks to maintain instance across renders.
 */
export const authRateLimiters = {
  login: () => new RateLimiter(1000),
  register: () => new RateLimiter(2000),
  forgotPassword: () => new RateLimiter(5000),
  resendVerification: () => new RateLimiter(60000),
};
