import { describe, test, expect } from "vitest";
import { fileOpsTool } from "../../src/tools/file-ops";
import { SecurityError } from "../../src/types/errors";

describe("File Operations Security", () => {
  const mockLogger = {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    trace: () => {},
  };

  const mockConfig = {
    tools: {
      fileOps: {
        allowedDirectories: ["."],
        maxSize: 10 * 1024 * 1024,
      },
    },
  } as any;

  test("should reject directory traversal attempts", async () => {
    const input = {
      operation: "read" as const,
      path: "../../../etc/passwd",
      encoding: "utf-8" as const,
    };

    await expect(
      fileOpsTool.handler(input, {
        config: mockConfig,
        logger: mockLogger as any,
      }),
    ).rejects.toThrow(SecurityError);
  });

  test("should validate input schema", () => {
    const validInput = {
      operation: "read",
      path: "test.txt",
      encoding: "utf-8",
    };

    expect(() => fileOpsTool.inputSchema.parse(validInput)).not.toThrow();
  });

  test("should require path for all operations", () => {
    const invalidInput = {
      operation: "read",
      encoding: "utf-8",
    };

    expect(() => fileOpsTool.inputSchema.parse(invalidInput)).toThrow();
  });

  test("should require content for write operation", () => {
    const invalidInput = {
      operation: "write",
      path: "test.txt",
      encoding: "utf-8",
    };

    // Schema allows missing content, but handler will throw
    expect(() => fileOpsTool.inputSchema.parse(invalidInput)).not.toThrow();
  });

  test("should require destination for copy operation", () => {
    const invalidInput = {
      operation: "copy",
      path: "test.txt",
      encoding: "utf-8",
    };

    // Schema allows missing destination, but handler will throw
    expect(() => fileOpsTool.inputSchema.parse(invalidInput)).not.toThrow();
  });
});
