import { z } from "zod";
import {
  readFileSync,
  writeFileSync,
  appendFileSync,
  readdirSync,
  mkdirSync,
  copyFileSync,
  renameSync,
  unlinkSync,
  rmdirSync,
  statSync,
  existsSync,
} from "fs";
import { join, resolve, dirname } from "path";
import type { ToolDefinition } from "../types/tools";
import { ToolError, ValidationError, SecurityError } from "../types/errors";
import { validatePath } from "../utils/security";

const inputSchema = z.object({
  operation: z
    .enum([
      "read",
      "write",
      "append",
      "list",
      "mkdir",
      "copy",
      "move",
      "delete",
    ])
    .describe("File operation to perform"),
  path: z.string().min(1).describe("File or directory path"),
  content: z
    .string()
    .optional()
    .describe("Content for write/append operations"),
  destination: z
    .string()
    .optional()
    .describe("Destination path for copy/move operations"),
  encoding: z
    .enum(["utf-8", "binary", "base64"])
    .default("utf-8")
    .describe("File encoding"),
  recursive: z.boolean().optional()
      .describe("Recursive operation for directories"),
});

type Input = z.infer<typeof inputSchema>;

interface OperationResult {
  success: boolean;
  data?: any;
  error?: string;
}

function performOperation(
  operation: string,
  validatedPath: string,
  input: Input,
  maxSize: number,
): OperationResult {
  switch (operation) {
    case "read": {
      if (!existsSync(validatedPath)) {
        throw new ToolError("file-ops", `File not found: ${input.path}`);
      }

      const stats = statSync(validatedPath);

      if (stats.isDirectory()) {
        throw new ToolError(
          "file-ops",
          `Cannot read directory as file: ${input.path}`,
        );
      }

      if (stats.size > maxSize) {
        throw new ToolError(
          "file-ops",
          `File too large: ${stats.size} bytes (max: ${maxSize})`,
        );
      }

      const content = readFileSync(
        validatedPath,
        input.encoding as BufferEncoding,
      );

      return {
        success: true,
        data: {
          content,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          created: stats.birthtime.toISOString(),
        },
      };
    }

    case "write": {
      if (!input.content) {
        throw new ValidationError("Content required for write operation");
      }

      // Ensure parent directory exists
      const parentDir = dirname(validatedPath);
      if (!existsSync(parentDir)) {
        mkdirSync(parentDir, { recursive: true });
      }

      writeFileSync(
        validatedPath,
        input.content,
        input.encoding as BufferEncoding,
      );

      return {
        success: true,
        data: {
          bytesWritten: Buffer.byteLength(
            input.content,
            input.encoding as BufferEncoding,
          ),
          path: input.path,
        },
      };
    }

    case "append": {
      if (!input.content) {
        throw new ValidationError("Content required for append operation");
      }

      if (!existsSync(validatedPath)) {
        throw new ToolError("file-ops", `File not found: ${input.path}`);
      }

      const stats = statSync(validatedPath);
      if (stats.isDirectory()) {
        throw new ToolError(
          "file-ops",
          `Cannot append to directory: ${input.path}`,
        );
      }

      appendFileSync(
        validatedPath,
        input.content,
        input.encoding as BufferEncoding,
      );

      return {
        success: true,
        data: {
          bytesAppended: Buffer.byteLength(
            input.content,
            input.encoding as BufferEncoding,
          ),
          path: input.path,
        },
      };
    }

    case "list": {
      if (!existsSync(validatedPath)) {
        throw new ToolError("file-ops", `Directory not found: ${input.path}`);
      }

      const stats = statSync(validatedPath);
      if (!stats.isDirectory()) {
        throw new ToolError("file-ops", `Not a directory: ${input.path}`);
      }

      const items = readdirSync(validatedPath, { withFileTypes: true });

      return {
        success: true,
        data: {
          items: items.map((item) => ({
            name: item.name,
            type: item.isDirectory() ? "directory" : "file",
            path: join(input.path, item.name),
          })),
          count: items.length,
        },
      };
    }

    case "mkdir": {
      mkdirSync(validatedPath, { recursive: input.recursive ?? true });

      return {
        success: true,
        data: {
          created: input.path,
        },
      };
    }

    case "copy": {
      if (!input.destination) {
        throw new ValidationError("Destination required for copy operation");
      }

      if (!existsSync(validatedPath)) {
        throw new ToolError("file-ops", `Source not found: ${input.path}`);
      }

      // Validate destination path
      const validatedDest = validatePath(input.destination, [process.cwd()]);

      const stats = statSync(validatedPath);

      if (stats.isDirectory()) {
        throw new ToolError(
          "file-ops",
          "Directory copy not implemented. Use file copy only.",
        );
      }

      // Ensure parent directory of destination exists
      const destParent = dirname(validatedDest);
      if (!existsSync(destParent)) {
        mkdirSync(destParent, { recursive: true });
      }

      copyFileSync(validatedPath, validatedDest);

      return {
        success: true,
        data: {
          from: input.path,
          to: input.destination,
        },
      };
    }

    case "move": {
      if (!input.destination) {
        throw new ValidationError("Destination required for move operation");
      }

      if (!existsSync(validatedPath)) {
        throw new ToolError("file-ops", `Source not found: ${input.path}`);
      }

      // Validate destination path
      const validatedDest = validatePath(input.destination, [process.cwd()]);

      // Ensure parent directory of destination exists
      const destParent = dirname(validatedDest);
      if (!existsSync(destParent)) {
        mkdirSync(destParent, { recursive: true });
      }

      renameSync(validatedPath, validatedDest);

      return {
        success: true,
        data: {
          from: input.path,
          to: input.destination,
        },
      };
    }

    case "delete": {
      if (!existsSync(validatedPath)) {
        throw new ToolError("file-ops", `Path not found: ${input.path}`);
      }

      const stats = statSync(validatedPath);

      if (stats.isDirectory()) {
        if (input.recursive) {
          // Use rmSync for recursive delete in newer Node.js
          const { rmSync } = require("fs");
          rmSync(validatedPath, { recursive: true, force: true });
        } else {
          // Check if directory is empty
          const items = readdirSync(validatedPath);
          if (items.length > 0) {
            throw new ToolError(
              "file-ops",
              `Directory not empty: ${input.path}. Use recursive: true to delete.`,
            );
          }
          rmdirSync(validatedPath);
        }
      } else {
        unlinkSync(validatedPath);
      }

      return {
        success: true,
        data: {
          deleted: input.path,
        },
      };
    }

    default:
      throw new ToolError("file-ops", `Unknown operation: ${operation}`);
  }
}

export const fileOpsTool: ToolDefinition<Input, OperationResult> = {
  name: "file-ops",
  description:
    "Perform file operations: read, write, append, list, mkdir, copy, move, delete. All operations are restricted to allowed directories for security.",
  inputSchema,
  handler: async (input, context) => {
    const { config, logger } = context;

    logger.debug(
      { operation: input.operation, path: input.path },
      "Performing file operation",
    );

    // Validate path
    const allowedDirectories = config.tools.fileOps.allowedDirectories.map(
      (dir) => resolve(process.cwd(), dir),
    );
    const validatedPath = validatePath(input.path, allowedDirectories);

    // Validate destination if present
    if (input.destination) {
      validatePath(input.destination, allowedDirectories);
    }

    // Perform operation
    const result = performOperation(
      input.operation,
      validatedPath,
      input,
      config.tools.fileOps.maxSize,
    );

    logger.info(
      { operation: input.operation, path: input.path, success: result.success },
      "File operation completed",
    );

    return result;
  },
};
