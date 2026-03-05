import { z } from "zod";

export const ConfigSchema = z.object({
  github: z.object({
    token: z
      .string()
      .optional()
      .describe("GitHub personal access token for API access"),
  }),

  logging: z.object({
    level: z
      .enum(["debug", "info", "warn", "error"])
      .default("info")
      .describe("Logging level: debug, info, warn, or error"),
  }),

  rateLimit: z.object({
    requests: z
      .number()
      .int()
      .positive()
      .min(1, { message: "Rate limit must be at least 1 request" })
      .max(1000, { message: "Rate limit cannot exceed 1000 requests" })
      .default(100)
      .describe("Maximum number of requests allowed per window"),
    windowMs: z
      .number()
      .int()
      .positive()
      .min(1000, {
        message: "Rate limit window must be at least 1 second (1000ms)",
      })
      .max(3600000, {
        message: "Rate limit window cannot exceed 1 hour (3600000ms)",
      })
      .default(60000)
      .describe("Rate limit window in milliseconds"),
  }),

  fetcher: z.object({
    timeoutMs: z
      .number()
      .int()
      .positive()
      .min(1000, {
        message: "Fetch timeout must be at least 1 second (1000ms)",
      })
      .max(120000, {
        message: "Fetch timeout cannot exceed 2 minutes (120000ms)",
      })
      .default(30000)
      .describe("HTTP request timeout in milliseconds"),
    retries: z
      .number()
      .int()
      .nonnegative()
      .min(0, { message: "Retries must be 0 or greater" })
      .max(10, { message: "Retries cannot exceed 10" })
      .default(3)
      .describe("Number of retry attempts for failed requests"),
  }),

  sandbox: z.object({
    enabled: z
      .boolean()
      .default(true)
      .describe("Enable sandbox mode for code execution"),
    timeoutMs: z
      .number()
      .int()
      .positive()
      .min(1000, {
        message: "Sandbox timeout must be at least 1 second (1000ms)",
      })
      .max(300000, {
        message: "Sandbox timeout cannot exceed 5 minutes (300000ms)",
      })
      .default(10000)
      .describe("Code execution timeout in milliseconds"),
  }),

  fileOperations: z.object({
    allowedPaths: z
      .array(z.string())
      .min(1, { message: "At least one allowed path must be specified" })
      .default(["."])
      .describe("List of allowed file operation paths"),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;
