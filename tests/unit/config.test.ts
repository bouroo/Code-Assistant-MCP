import { describe, test, expect } from "vitest";
import { configSchema } from "../../src/config/schema";

describe("Configuration Schema", () => {
  test("should validate minimal configuration", () => {
    const minimalConfig = {
      server: {
        name: "test-server",
        version: "1.0.0",
      },
    };

    const result = configSchema.safeParse(minimalConfig);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.server.name).toBe("test-server");
      expect(result.data.tools.webSearch.enabled).toBe(true);
    }
  });

  test("should apply defaults for missing fields", () => {
    const partialConfig = {};

    const result = configSchema.safeParse(partialConfig);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.server.name).toBe("code-assistant-mcp");
      expect(result.data.transport.stdio).toBe(true);
      expect(result.data.tools.webSearch.timeout).toBe(10000);
    }
  });

  test("should reject invalid log level", () => {
    const invalidConfig = {
      logging: {
        level: "invalid",
      },
    };

    const result = configSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
  });

  test("should validate complete configuration", () => {
    const completeConfig = {
      server: {
        name: "test-server",
        version: "1.0.0",
        description: "Test server",
      },
      transport: {
        stdio: true,
        http: {
          enabled: true,
          port: 3000,
          host: "localhost",
          auth: {
            enabled: false,
          },
        },
      },
      tools: {
        webSearch: {
          enabled: true,
          timeout: 10000,
          maxResults: 10,
        },
        docSearch: {
          enabled: true,
          timeout: 15000,
          maxResults: 20,
        },
        webReader: {
          enabled: true,
          timeout: 15000,
          maxSize: 5242880,
        },
        codeExec: {
          enabled: true,
          timeout: 30000,
          memoryLimit: 256,
          languages: ["javascript", "typescript", "python", "bash"],
        },
        fileOps: {
          enabled: true,
          allowedDirectories: ["."],
          maxSize: 10485760,
        },
      },
      security: {
        rateLimit: {
          enabled: true,
          windowMs: 60000,
          maxRequests: 100,
        },
      },
      logging: {
        level: "info",
        prettyPrint: true,
        file: {
          enabled: true,
          path: "logs/server.log",
          maxSize: 10485760,
          maxFiles: 5,
        },
      },
    };

    const result = configSchema.safeParse(completeConfig);
    expect(result.success).toBe(true);
  });
});
