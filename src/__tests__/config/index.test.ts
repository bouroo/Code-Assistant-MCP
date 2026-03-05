import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadConfig } from "../../config/index.js";

describe("Config", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("LOG_LEVEL", "info");
    vi.stubEnv("RATE_LIMIT_REQUESTS", "100");
    vi.stubEnv("RATE_LIMIT_WINDOW_MS", "60000");
    vi.stubEnv("FETCH_TIMEOUT_MS", "30000");
    vi.stubEnv("FETCH_RETRIES", "3");
    vi.stubEnv("SANDBOX_ENABLED", "true");
    vi.stubEnv("SANDBOX_TIMEOUT_MS", "10000");
    vi.stubEnv("ALLOWED_PATHS", ".");
    vi.stubEnv("GITHUB_TOKEN", "");
  });

  it("should load config with default values", () => {
    const config = loadConfig();

    // Token should be undefined or empty string when not set
    expect(
      config.github.token === undefined || config.github.token === "",
    ).toBe(true);
    expect(config.logging.level).toBe("info");
    expect(config.rateLimit.requests).toBe(100);
    expect(config.rateLimit.windowMs).toBe(60000);
    expect(config.fetcher.timeoutMs).toBe(30000);
    expect(config.fetcher.retries).toBe(3);
    expect(config.sandbox.enabled).toBe(true);
    expect(config.sandbox.timeoutMs).toBe(10000);
    expect(config.fileOperations.allowedPaths).toEqual(["."]);
  });

  it("should load config with custom LOG_LEVEL", () => {
    vi.stubEnv("LOG_LEVEL", "debug");

    const config = loadConfig();
    expect(config.logging.level).toBe("debug");
  });

  it("should load config with custom rate limit settings", () => {
    vi.stubEnv("RATE_LIMIT_REQUESTS", "50");
    vi.stubEnv("RATE_LIMIT_WINDOW_MS", "30000");

    const config = loadConfig();
    expect(config.rateLimit.requests).toBe(50);
    expect(config.rateLimit.windowMs).toBe(30000);
  });

  it("should load config with custom fetcher settings", () => {
    vi.stubEnv("FETCH_TIMEOUT_MS", "60000");
    vi.stubEnv("FETCH_RETRIES", "5");

    const config = loadConfig();
    expect(config.fetcher.timeoutMs).toBe(60000);
    expect(config.fetcher.retries).toBe(5);
  });

  it("should load config with custom sandbox settings", () => {
    vi.stubEnv("SANDBOX_ENABLED", "false");
    vi.stubEnv("SANDBOX_TIMEOUT_MS", "5000");

    const config = loadConfig();
    expect(config.sandbox.enabled).toBe(false);
    expect(config.sandbox.timeoutMs).toBe(5000);
  });

  it("should load config with custom file operations settings", () => {
    vi.stubEnv("ALLOWED_PATHS", "/tmp,/home/user");

    const config = loadConfig();
    expect(config.fileOperations.allowedPaths).toEqual(["/tmp", "/home/user"]);
  });

  it("should load config with GitHub token", () => {
    vi.stubEnv("GITHUB_TOKEN", "ghp_test_token");

    const config = loadConfig();
    expect(config.github.token).toBe("ghp_test_token");
  });

  it("should throw on invalid LOG_LEVEL", () => {
    vi.stubEnv("LOG_LEVEL", "invalid");

    expect(() => loadConfig()).toThrow("Invalid configuration");
  });

  it("should throw on invalid RATE_LIMIT_REQUESTS", () => {
    vi.stubEnv("RATE_LIMIT_REQUESTS", "invalid");

    expect(() => loadConfig()).toThrow("Invalid configuration");
  });

  it("should throw on negative RATE_LIMIT_REQUESTS", () => {
    vi.stubEnv("RATE_LIMIT_REQUESTS", "-1");

    expect(() => loadConfig()).toThrow("Invalid configuration");
  });

  it("should throw when RATE_LIMIT_REQUESTS exceeds maximum", () => {
    vi.stubEnv("RATE_LIMIT_REQUESTS", "2000");

    expect(() => loadConfig()).toThrow("Invalid configuration");
  });

  it("should throw when RATE_LIMIT_WINDOW_MS is below minimum", () => {
    vi.stubEnv("RATE_LIMIT_WINDOW_MS", "500");

    expect(() => loadConfig()).toThrow("Invalid configuration");
  });

  it("should throw when RATE_LIMIT_WINDOW_MS exceeds maximum", () => {
    vi.stubEnv("RATE_LIMIT_WINDOW_MS", "7200000");

    expect(() => loadConfig()).toThrow("Invalid configuration");
  });

  it("should throw when FETCH_TIMEOUT_MS is below minimum", () => {
    vi.stubEnv("FETCH_TIMEOUT_MS", "500");

    expect(() => loadConfig()).toThrow("Invalid configuration");
  });

  it("should throw when FETCH_TIMEOUT_MS exceeds maximum", () => {
    vi.stubEnv("FETCH_TIMEOUT_MS", "300000");

    expect(() => loadConfig()).toThrow("Invalid configuration");
  });

  it("should throw when FETCH_RETRIES exceeds maximum", () => {
    vi.stubEnv("FETCH_RETRIES", "20");

    expect(() => loadConfig()).toThrow("Invalid configuration");
  });

  it("should throw when SANDBOX_TIMEOUT_MS is below minimum", () => {
    vi.stubEnv("SANDBOX_TIMEOUT_MS", "500");

    expect(() => loadConfig()).toThrow("Invalid configuration");
  });

  it("should throw when SANDBOX_TIMEOUT_MS exceeds maximum", () => {
    vi.stubEnv("SANDBOX_TIMEOUT_MS", "600000");

    expect(() => loadConfig()).toThrow("Invalid configuration");
  });
});
