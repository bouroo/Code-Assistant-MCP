export class McpToolError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'McpToolError';
  }
}

export class RateLimitError extends McpToolError {
  constructor(retryAfter?: number) {
    super('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded', { retryAfter });
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends McpToolError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends McpToolError {
  constructor(resource: string) {
    super('NOT_FOUND', `Resource not found: ${resource}`);
    this.name = 'NotFoundError';
  }
}

export class TimeoutError extends McpToolError {
  constructor(operation: string, timeout: number) {
    super('TIMEOUT', `Operation '${operation}' timed out after ${timeout}ms`);
    this.name = 'TimeoutError';
  }
}

export class ForbiddenError extends McpToolError {
  constructor(message: string) {
    super('FORBIDDEN', message);
    this.name = 'ForbiddenError';
  }
}

export function formatError(error: unknown): { code: string; message: string; details?: unknown } {
  if (error instanceof McpToolError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details
    };
  }
  
  if (error instanceof Error) {
    return {
      code: 'INTERNAL_ERROR',
      message: error.message
    };
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred'
  };
}
