export class McpToolError extends Error {
  constructor(
    // eslint-disable-next-line no-unused-vars
    public readonly _code: string,
    message: string,
    // eslint-disable-next-line no-unused-vars
    public readonly _details?: unknown,
  ) {
    super(message);
    this.name = "McpToolError";
  }

  get code(): string {
    return this._code;
  }

  get details(): unknown {
    return this._details;
  }
}

export class RateLimitError extends McpToolError {
  constructor(retryAfter?: number) {
    super("RATE_LIMIT_EXCEEDED", "Rate limit exceeded", { retryAfter });
    this.name = "RateLimitError";
  }
}

export class ValidationError extends McpToolError {
  constructor(message: string, details?: unknown) {
    super("VALIDATION_ERROR", message, details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends McpToolError {
  constructor(resource: string) {
    super("NOT_FOUND", `Resource not found: ${resource}`);
    this.name = "NotFoundError";
  }
}

export class TimeoutError extends McpToolError {
  constructor(operation: string, timeout: number) {
    super("TIMEOUT", `Operation '${operation}' timed out after ${timeout}ms`);
    this.name = "TimeoutError";
  }
}

export class ForbiddenError extends McpToolError {
  constructor(message: string) {
    super("FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
}

/**
 * Network-related errors (failed to connect, DNS issues, etc.)
 */
export class NetworkError extends McpToolError {
  constructor(message: string, statusCode?: number, details?: unknown) {
    const errorDetails =
      statusCode !== undefined
        ? details
          ? { statusCode, ...(details as object) }
          : { statusCode }
        : details;
    super("NETWORK_ERROR", message, errorDetails);
    this.name = "NetworkError";
  }
}

/**
 * Authentication/Authorization errors for GitHub API
 */
export class AuthenticationError extends McpToolError {
  constructor(message: string, details?: unknown) {
    super("AUTHENTICATION_ERROR", message, details);
    this.name = "AuthenticationError";
  }
}

/**
 * HTML/XML parsing errors
 */
export class ParseError extends McpToolError {
  constructor(message: string, details?: unknown) {
    super("PARSE_ERROR", message, details);
    this.name = "ParseError";
  }
}

export function formatError(error: unknown): {
  code: string;
  message: string;
  details?: unknown;
} {
  if (error instanceof McpToolError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      code: "INTERNAL_ERROR",
      message: error.message,
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "An unknown error occurred",
  };
}
