import { vi } from "vitest";

// Mock console methods to reduce noise during tests
vi.stubGlobal("console", {
  ...console,
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

// Setup environment variables for tests
process.env.LOG_LEVEL = "error";
process.env.RATE_LIMIT_REQUESTS = "100";
process.env.RATE_LIMIT_WINDOW_MS = "60000";
process.env.FETCH_TIMEOUT_MS = "5000";
process.env.FETCH_RETRIES = "3";
process.env.SANDBOX_ENABLED = "true";
process.env.SANDBOX_TIMEOUT_MS = "5000";
