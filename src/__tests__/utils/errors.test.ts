import { describe, it, expect } from "vitest";
import {
  McpToolError,
  RateLimitError,
  ValidationError,
  NotFoundError,
  TimeoutError,
  ForbiddenError,
  NetworkError,
  AuthenticationError,
  ParseError,
  formatError,
} from "../../utils/errors.js";

describe("Error Classes", () => {
  describe("McpToolError", () => {
    it("should create error with code and message", () => {
      const error = new McpToolError("TEST_CODE", "Test message");

      expect(error.code).toBe("TEST_CODE");
      expect(error.message).toBe("Test message");
      expect(error.name).toBe("McpToolError");
    });

    it("should include details when provided", () => {
      const details = { extra: "info" };
      const error = new McpToolError("TEST_CODE", "Test message", details);

      expect(error.details).toEqual(details);
    });
  });

  describe("RateLimitError", () => {
    it("should create rate limit error", () => {
      const error = new RateLimitError();

      expect(error.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(error.name).toBe("RateLimitError");
    });

    it("should include retryAfter in details", () => {
      const error = new RateLimitError(60);

      expect(error.details).toEqual({ retryAfter: 60 });
    });
  });

  describe("ValidationError", () => {
    it("should create validation error", () => {
      const error = new ValidationError("Invalid input");

      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.message).toBe("Invalid input");
      expect(error.name).toBe("ValidationError");
    });

    it("should include details when provided", () => {
      const details = { field: "email" };
      const error = new ValidationError("Invalid input", details);

      expect(error.details).toEqual(details);
    });
  });

  describe("NotFoundError", () => {
    it("should create not found error", () => {
      const error = new NotFoundError("resource-id");

      expect(error.code).toBe("NOT_FOUND");
      expect(error.message).toBe("Resource not found: resource-id");
      expect(error.name).toBe("NotFoundError");
    });
  });

  describe("TimeoutError", () => {
    it("should create timeout error", () => {
      const error = new TimeoutError("operation", 5000);

      expect(error.code).toBe("TIMEOUT");
      expect(error.message).toBe(
        "Operation 'operation' timed out after 5000ms",
      );
      expect(error.name).toBe("TimeoutError");
    });
  });

  describe("ForbiddenError", () => {
    it("should create forbidden error", () => {
      const error = new ForbiddenError("Access denied");

      expect(error.code).toBe("FORBIDDEN");
      expect(error.message).toBe("Access denied");
      expect(error.name).toBe("ForbiddenError");
    });
  });

  describe("NetworkError", () => {
    it("should create network error with message only", () => {
      const error = new NetworkError("Connection failed");

      expect(error.code).toBe("NETWORK_ERROR");
      expect(error.message).toBe("Connection failed");
      expect(error.name).toBe("NetworkError");
      expect(error.details).toBeUndefined();
    });

    it("should include status code in details", () => {
      const error = new NetworkError("Request failed", 500);

      expect(error.details).toEqual({ statusCode: 500 });
    });

    it("should include additional details", () => {
      const error = new NetworkError("Request failed", 404, {
        url: "/api/test",
      });

      expect(error.details).toEqual({ statusCode: 404, url: "/api/test" });
    });
  });

  describe("AuthenticationError", () => {
    it("should create authentication error", () => {
      const error = new AuthenticationError("Invalid token");

      expect(error.code).toBe("AUTHENTICATION_ERROR");
      expect(error.message).toBe("Invalid token");
      expect(error.name).toBe("AuthenticationError");
    });

    it("should include details when provided", () => {
      const error = new AuthenticationError("Token expired", {
        tokenType: "Bearer",
      });

      expect(error.details).toEqual({ tokenType: "Bearer" });
    });
  });

  describe("ParseError", () => {
    it("should create parse error", () => {
      const error = new ParseError("Invalid HTML");

      expect(error.code).toBe("PARSE_ERROR");
      expect(error.message).toBe("Invalid HTML");
      expect(error.name).toBe("ParseError");
    });

    it("should include details when provided", () => {
      const error = new ParseError("Invalid HTML", { line: 10, column: 5 });

      expect(error.details).toEqual({ line: 10, column: 5 });
    });
  });
});

describe("formatError", () => {
  it("should format McpToolError correctly", () => {
    const error = new McpToolError("CODE", "message", { details: "info" });
    const result = formatError(error);

    expect(result).toEqual({
      code: "CODE",
      message: "message",
      details: { details: "info" },
    });
  });

  it("should format generic Error correctly", () => {
    const error = new Error("Generic error");
    const result = formatError(error);

    expect(result).toEqual({
      code: "INTERNAL_ERROR",
      message: "Generic error",
    });
  });

  it("should handle string errors", () => {
    const result = formatError("String error");

    expect(result).toEqual({
      code: "UNKNOWN_ERROR",
      message: "An unknown error occurred",
    });
  });

  it("should handle null errors", () => {
    const result = formatError(null);

    expect(result).toEqual({
      code: "UNKNOWN_ERROR",
      message: "An unknown error occurred",
    });
  });

  it("should handle undefined errors", () => {
    const result = formatError(undefined);

    expect(result).toEqual({
      code: "UNKNOWN_ERROR",
      message: "An unknown error occurred",
    });
  });

  it("should handle objects without message property", () => {
    const result = formatError({ code: "ERR_CODE" });

    expect(result).toEqual({
      code: "UNKNOWN_ERROR",
      message: "An unknown error occurred",
    });
  });
});
