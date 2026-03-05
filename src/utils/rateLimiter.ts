export class RateLimiter {
  private tokens: number;
  private readonly maxTokens: number;
  private readonly refillInterval: number;
  private lastRefill: number;

  constructor(maxTokens: number, refillIntervalMs: number) {
    this.tokens = maxTokens;
    this.maxTokens = maxTokens;
    this.refillInterval = refillIntervalMs;
    this.lastRefill = Date.now();
  }

  async waitForSlot(): Promise<void> {
    this.refill();

    if (this.tokens > 0) {
      this.tokens--;
      return;
    }

    const waitTime = this.refillInterval / this.maxTokens;
    await this.delay(waitTime);
    return this.waitForSlot();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;

    if (elapsed >= this.refillInterval) {
      const refillCycles = Math.floor(elapsed / this.refillInterval);
      this.tokens = Math.min(this.maxTokens, this.tokens + refillCycles);
      this.lastRefill = now - (elapsed % this.refillInterval);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getTokens(): number {
    return this.tokens;
  }

  getMaxTokens(): number {
    return this.maxTokens;
  }
}
