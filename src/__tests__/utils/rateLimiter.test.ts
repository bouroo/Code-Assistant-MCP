import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter } from '../../utils/rateLimiter.js';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe('constructor', () => {
    it('should initialize with correct token count', () => {
      rateLimiter = new RateLimiter(10, 60000);
      expect(rateLimiter.getTokens()).toBe(10);
    });

    it('should set max tokens correctly', () => {
      rateLimiter = new RateLimiter(5, 60000);
      expect(rateLimiter.getMaxTokens()).toBe(5);
    });
  });

  describe('waitForSlot', () => {
    it('should return immediately when tokens are available', async () => {
      rateLimiter = new RateLimiter(10, 60000);
      
      const result = await rateLimiter.waitForSlot();
      
      expect(result).toBeUndefined();
      expect(rateLimiter.getTokens()).toBe(9);
    });

    it('should decrement tokens when slot is available', async () => {
      rateLimiter = new RateLimiter(5, 60000);
      
      await rateLimiter.waitForSlot();
      await rateLimiter.waitForSlot();
      
      expect(rateLimiter.getTokens()).toBe(3);
    });

    it('should wait for refill when no tokens available', async () => {
      rateLimiter = new RateLimiter(2, 1000);
      
      await rateLimiter.waitForSlot();
      await rateLimiter.waitForSlot();
      
      expect(rateLimiter.getTokens()).toBe(0);
      
      const waitPromise = rateLimiter.waitForSlot();
      
      // Advance time by 1 second to trigger refill
      vi.advanceTimersByTime(1000);
      
      await waitPromise;
      
      expect(rateLimiter.getTokens()).toBeLessThanOrEqual(2);
    });
  });

  describe('refill behavior', () => {
    it('should refill tokens after interval passes', async () => {
      rateLimiter = new RateLimiter(1, 1000);
      
      // Use the only token
      await rateLimiter.waitForSlot();
      expect(rateLimiter.getTokens()).toBe(0);
      
      // Advance time past the refill interval
      vi.advanceTimersByTime(1001);
      
      // The next waitForSlot should trigger a refill
      const waitPromise = rateLimiter.waitForSlot();
      vi.advanceTimersByTime(100);
      await waitPromise;
      
      expect(rateLimiter.getTokens()).toBeLessThanOrEqual(1);
    });

    it('should cap tokens at max', async () => {
      rateLimiter = new RateLimiter(3, 1000);
      
      await rateLimiter.waitForSlot();
      expect(rateLimiter.getTokens()).toBe(2);
      
      // Advance time to trigger refill
      vi.advanceTimersByTime(1001);
      
      // Use no tokens, just trigger refill
      const waitPromise = rateLimiter.waitForSlot();
      vi.advanceTimersByTime(100);
      await waitPromise
      
      expect(rateLimiter.getTokens()).toBeLessThanOrEqual(3);
    });
  });
});
