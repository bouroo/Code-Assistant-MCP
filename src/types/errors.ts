export class MCPError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any,
  ) {
    super(message);
    this.name = "MCPError";

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, MCPError.prototype);
  }
}

export class ToolError extends MCPError {
  constructor(toolName: string, message: string, details?: any) {
    super("TOOL_ERROR", `[${toolName}] ${message}`, details);
    this.name = "ToolError";

    Object.setPrototypeOf(this, ToolError.prototype);
  }
}

export class ValidationError extends MCPError {
  constructor(message: string, details?: any) {
    super("VALIDATION_ERROR", message, details);
    this.name = "ValidationError";

    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class SecurityError extends MCPError {
  constructor(message: string, details?: any) {
    super("SECURITY_ERROR", message, details);
    this.name = "SecurityError";

    Object.setPrototypeOf(this, SecurityError.prototype);
  }
}

export class RateLimitError extends MCPError {
  constructor(message: string = "Rate limit exceeded") {
    super("RATE_LIMIT_ERROR", message);
    this.name = "RateLimitError";

    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class TimeoutError extends MCPError {
  constructor(operation: string, timeout: number) {
    super("TIMEOUT_ERROR", `${operation} timed out after ${timeout}ms`);
    this.name = "TimeoutError";

    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export class ConfigError extends MCPError {
  constructor(message: string, details?: any) {
    super("CONFIG_ERROR", message, details);
    this.name = "ConfigError";

    Object.setPrototypeOf(this, ConfigError.prototype);
  }
}
