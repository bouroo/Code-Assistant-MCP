import { describe, test, expect, beforeEach } from "vitest";
import { webSearchTool } from "../../src/tools/web-search";

describe("Web Search Tool", () => {
  const mockLogger = {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    trace: () => {},
  };

  const mockConfig = {
    tools: {
      webSearch: {
        timeout: 10000,
        maxResults: 10,
      },
    },
  } as any;

  test("should validate input schema with valid input", () => {
    const validInput = {
      query: "test query",
      maxResults: 5,
    };

    expect(() => webSearchTool.inputSchema.parse(validInput)).not.toThrow();
  });

  test("should reject empty query", () => {
    const invalidInput = {
      query: "",
    };

    expect(() => webSearchTool.inputSchema.parse(invalidInput)).toThrow();
  });

  test("should enforce max results limit", () => {
    const invalidInput = {
      query: "test",
      maxResults: 100,
    };

    expect(() => webSearchTool.inputSchema.parse(invalidInput)).toThrow();
  });

  test("should reject query exceeding max length", () => {
    const invalidInput = {
      query: "a".repeat(501),
    };

    expect(() => webSearchTool.inputSchema.parse(invalidInput)).toThrow();
  });

  test("should use default maxResults when not provided", () => {
    const input = {
      query: "test",
    };

    const result = webSearchTool.inputSchema.parse(input);
    expect(result.maxResults).toBe(10);
  });
});
