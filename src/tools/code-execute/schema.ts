import { z } from "zod";

export const CodeExecuteInputSchema = z.object({
  code: z
    .string()
    .max(100000, "Code must be less than 100KB")
    .describe("The code to execute"),

  language: z
    .enum(["javascript", "typescript", "python", "bash", "sql"])
    .describe("Programming language of the code"),

  timeout: z
    .number()
    .int()
    .min(1)
    .max(60)
    .default(10)
    .optional()
    .describe("Execution timeout in seconds"),

  input: z
    .string()
    .max(10000)
    .optional()
    .describe("Standard input for the program"),

  files: z
    .record(z.string())
    .optional()
    .describe("Additional files to include - filename to content mapping"),
});

export const CodeExecuteOutputSchema = z.object({
  stdout: z.string(),
  stderr: z.string(),
  exitCode: z.number(),
  executionTime: z.number().describe("Execution time in milliseconds"),
  language: z.string(),
  success: z.boolean(),
  error: z
    .object({
      type: z.string(),
      message: z.string(),
      line: z.number().optional(),
    })
    .optional(),
});
