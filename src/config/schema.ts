import { z } from "zod";

const serverSchema = z.object({
  name: z.string().default("code-assistant-mcp"),
  version: z.string().default("1.0.0"),
  description: z
    .string()
    .default("Production-ready MCP server for AI coding assistants"),
});

const httpAuthSchema = z.object({
  enabled: z.boolean().default(false),
  apiKey: z.string().optional(),
});

const httpSchema = z.object({
  enabled: z.boolean().default(false),
  port: z.number().default(3000),
  host: z.string().default("localhost"),
  auth: httpAuthSchema.default({}),
});

const transportSchema = z.object({
  stdio: z.boolean().default(true),
  http: httpSchema.default({}),
});

const webSearchSchema = z.object({
  enabled: z.boolean().default(true),
  timeout: z.number().default(10000),
  maxResults: z.number().default(10),
});

const docSearchSchema = z.object({
  enabled: z.boolean().default(true),
  githubToken: z.string().optional(),
  timeout: z.number().default(15000),
  maxResults: z.number().default(20),
});

const webReaderSchema = z.object({
  enabled: z.boolean().default(true),
  timeout: z.number().default(15000),
  maxSize: z.number().default(5 * 1024 * 1024), // 5MB
});

const codeExecSchema = z.object({
  enabled: z.boolean().default(true),
  timeout: z.number().default(30000),
  memoryLimit: z.number().default(256), // MB
  languages: z
    .array(z.enum(["javascript", "typescript", "python", "bash"]))
    .default(["javascript", "typescript", "python", "bash"]),
});

const fileOpsSchema = z.object({
  enabled: z.boolean().default(true),
  allowedDirectories: z.array(z.string()).default(["."]),
  maxSize: z.number().default(10 * 1024 * 1024), // 10MB
});

const toolsSchema = z.object({
  webSearch: webSearchSchema.default({}),
  docSearch: docSearchSchema.default({}),
  webReader: webReaderSchema.default({}),
  codeExec: codeExecSchema.default({}),
  fileOps: fileOpsSchema.default({}),
});

const rateLimitSchema = z.object({
  enabled: z.boolean().default(true),
  windowMs: z.number().default(60000), // 1 minute
  maxRequests: z.number().default(100),
});

const securitySchema = z.object({
  rateLimit: rateLimitSchema.default({}),
});

const loggingFileSchema = z.object({
  enabled: z.boolean().default(true),
  path: z.string().default("logs/server.log"),
  maxSize: z.number().default(10 * 1024 * 1024), // 10MB
  maxFiles: z.number().default(5),
});

const loggingSchema = z.object({
  level: z.enum(["error", "warn", "info", "debug", "trace"]).default("info"),
  prettyPrint: z.boolean().default(true),
  file: loggingFileSchema.default({}),
});

export const configSchema = z.object({
  server: serverSchema.default({}),
  transport: transportSchema.default({}),
  tools: toolsSchema.default({}),
  security: securitySchema.default({}),
  logging: loggingSchema.default({}),
});

export type Config = z.infer<typeof configSchema>;
