import { describe, test, expect } from "vitest";
import { validatePath } from "../../src/utils/security";
import { SecurityError } from "../../src/types/errors";

describe("Security Utilities", () => {
  test("should validate path within allowed directories", () => {
    const allowedDirs = [process.cwd()];
    const result = validatePath("test.txt", allowedDirs);

    expect(result).toContain("test.txt");
  });

  test("should reject path outside allowed directories", () => {
    const allowedDirs = [process.cwd()];

    expect(() => validatePath("/etc/passwd", allowedDirs)).toThrow(
      SecurityError,
    );
  });

  test("should reject directory traversal attempts", () => {
    const allowedDirs = [process.cwd()];

    expect(() => validatePath("../../../etc/passwd", allowedDirs)).toThrow(
      SecurityError,
    );
  });

  test("should reject paths with null bytes", () => {
    const allowedDirs = [process.cwd()];

    expect(() => validatePath("test\x00.txt", allowedDirs)).toThrow(
      SecurityError,
    );
  });
});
