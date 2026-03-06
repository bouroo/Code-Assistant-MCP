import type { ZodSchema } from "zod";
import { ValidationError } from "../types/errors.js";

export function validateWithSchema<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));

    throw new ValidationError(
      `Validation failed: ${issues.map((i) => `${i.path}: ${i.message}`).join(", ")}`,
      { issues },
    );
  }

  return result.data;
}

export function sanitizeString(input: string): string {
  // Remove null bytes and other dangerous characters
  return input
    .replace(/\x00/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
}

export function truncateString(input: string, maxLength: number): string {
  if (input.length <= maxLength) return input;
  return input.substring(0, maxLength) + "...";
}
