import { describe, test, expect } from "vitest";
import { RateLimiter } from "../../src/middleware/rate-limiter";
import { RateLimitError } from "../../src/types/errors";

describe("Rate Limiter", () => {
  const mockLogger = {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    trace: () => {},
  };

  test("should allow requests within limit", () => {
    const limiter = new RateLimiter(60000, 5, mockLogger as any);

    expect(() => {
      for (let i = 0; i < 5; i++) {
        limiter.checkLimit("test-client");
      }
    }).not.toThrow();

    limiter.destroy();
  });

  test("should reject requests exceeding limit", () => {
    const limiter = new RateLimiter(60000, 2, mockLogger as any);

    limiter.checkLimit("test-client");
    limiter.checkLimit("test-client");

    expect(() => limiter.checkLimit("test-client")).toThrow(RateLimitError);

    limiter.destroy();
  });

  test("should track different clients separately", () => {
    const limiter = new RateLimiter(60000, 2, mockLogger as any);

    limiter.checkLimit("client-1");
    limiter.checkLimit("client-1");
    limiter.checkLimit("client-2");
    limiter.checkLimit("client-2");

    expect(() => limiter.checkLimit("client-1")).toThrow(RateLimitError);
    expect(() => limiter.checkLimit("client-2")).toThrow(RateLimitError);

    limiter.destroy();
  });

  test("should report remaining requests correctly", () => {
    const limiter = new RateLimiter(60000, 5, mockLogger as any);

    expect(limiter.getRemainingRequests("new-client")).toBe(5);

    limiter.checkLimit("new-client");
    expect(limiter.getRemainingRequests("new-client")).toBe(4);

    limiter.destroy();
  });
});
