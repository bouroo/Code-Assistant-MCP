import { resolve } from "path";
import { SecurityError } from "../types/errors";

export function validatePath(
  inputPath: string,
  allowedDirectories: string[],
): string {
  // Check for null bytes
  if (inputPath.includes("\x00")) {
    throw new SecurityError("Path contains null bytes");
  }

  // Check for directory traversal attempts
  if (inputPath.includes("..")) {
    throw new SecurityError("Directory traversal not allowed");
  }

  // Resolve to absolute path
  const absolutePath = resolve(process.cwd(), inputPath);

  // Check if path is within allowed directories
  const isAllowed = allowedDirectories.some((allowedDir) => {
    const absoluteAllowed = resolve(process.cwd(), allowedDir);
    return absolutePath.startsWith(absoluteAllowed);
  });

  if (!isAllowed) {
    throw new SecurityError(
      `Path "${inputPath}" is outside allowed directories`,
    );
  }

  return absolutePath;
}

export function isValidFilename(filename: string): boolean {
  // Check for invalid characters
  const invalidChars = /[\x00-\x1f\x7f\/\\:*?"\u003c\u003e|]/;
  return !invalidChars.test(filename);
}

export function sanitizePath(inputPath: string): string {
  // Remove null bytes and normalize
  return inputPath
    .replace(/\x00/g, "")
    .replace(/\/+/g, "/")
    .replace(/\\+/g, "\\");
}
