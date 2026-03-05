import { z } from "zod";

export const FileOperationsInputSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("read"),
    path: z.string().min(1).describe("File path to read"),
    encoding: z.enum(["utf-8", "base64", "binary"]).default("utf-8").optional(),
  }),
  z.object({
    operation: z.literal("write"),
    path: z.string().min(1).describe("File path to write"),
    content: z.string().describe("Content to write"),
    encoding: z.enum(["utf-8", "base64"]).default("utf-8").optional(),
  }),
  z.object({
    operation: z.literal("list"),
    path: z.string().min(1).describe("Directory path to list"),
    recursive: z.boolean().default(false).optional(),
    pattern: z.string().optional().describe("Glob pattern to filter files"),
  }),
  z.object({
    operation: z.literal("delete"),
    path: z.string().min(1).describe("File or directory path to delete"),
    recursive: z.boolean().default(false).optional(),
  }),
  z.object({
    operation: z.literal("exists"),
    path: z.string().min(1).describe("Path to check existence"),
  }),
  z.object({
    operation: z.literal("stat"),
    path: z.string().min(1).describe("Path to get stats for"),
  }),
]);

export const FileInfoSchema = z.object({
  name: z.string(),
  path: z.string(),
  type: z.enum(["file", "directory", "symlink"]),
  size: z.number().optional(),
  created: z.string().datetime().optional(),
  modified: z.string().datetime().optional(),
  permissions: z.string().optional(),
});

export const FileOperationsOutputSchema = z.union([
  z.object({
    operation: z.literal("read"),
    content: z.string(),
    encoding: z.string(),
    size: z.number(),
  }),
  z.object({
    operation: z.literal("write"),
    success: z.boolean(),
    bytesWritten: z.number(),
  }),
  z.object({
    operation: z.literal("list"),
    files: z.array(FileInfoSchema),
    totalFiles: z.number(),
    totalDirs: z.number(),
  }),
  z.object({
    operation: z.literal("delete"),
    success: z.boolean(),
    deletedPath: z.string(),
  }),
  z.object({
    operation: z.literal("exists"),
    exists: z.boolean(),
    path: z.string(),
  }),
  z.object({
    operation: z.literal("stat"),
    info: FileInfoSchema,
  }),
]);
