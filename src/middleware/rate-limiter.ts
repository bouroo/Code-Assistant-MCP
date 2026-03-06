import type { Logger } from "../utils/logger";
import { RateLimitError } from "../types/errors";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitStore {
  [key: string]: RateLimitEntry;
}

export class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private windowMs: number,
    private maxRequests: number,
    private logger: Logger,
  ) {
    // Clean up expired entries periodically
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      Object.keys(this.store).forEach((key) => {
        const entry = this.store[key];
        if (entry && entry.resetTime < now) {
          delete this.store[key];
        }
      });
    }, windowMs);
  }

  checkLimit(identifier: string): void {
    const now = Date.now();
    const entry = this.store[identifier];

    if (!entry || entry.resetTime < now) {
      // New window
      this.store[identifier] = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      return;
    }

    if (entry.count >= this.maxRequests) {
      this.logger.warn(
        {
          identifier,
          count: entry.count,
          limit: this.maxRequests,
          resetIn: entry.resetTime - now,
        },
        "Rate limit exceeded",
      );
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${Math.ceil((entry.resetTime - now) / 1000)} seconds.`,
      );
    }

    entry.count++;
  }

  getRemainingRequests(identifier: string): number {
    const entry = this.store[identifier];

    if (!entry || entry.resetTime < Date.now()) {
      return this.maxRequests;
    }

    return Math.max(0, this.maxRequests - entry.count);
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
