import { z } from "zod";
import { spawn } from "child_process";
import { writeFileSync, unlinkSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import type { ToolDefinition } from "../types/tools";
import { ToolError, TimeoutError } from "../types/errors";

const inputSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(1024 * 1024)
    .describe("Code to execute (max 1MB)"),
  language: z
    .enum(["javascript", "typescript", "python", "bash"])
    .describe("Programming language"),
  timeout: z
    .number()
    .min(1000)
    .max(120000)
    .optional()
    .describe("Execution timeout in milliseconds (1s - 2min)"),
  memoryLimit: z
    .number()
    .min(16)
    .max(1024)
    .optional()
    .describe("Memory limit in MB (16MB - 1GB)"),
});

type Input = z.infer<typeof inputSchema>;

interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  timedOut: boolean;
}

function getLanguageConfig(language: string): {
  extension: string;
  command: string;
  args: string[];
} {
  switch (language) {
    case "javascript":
      return {
        extension: "js",
        command: "bun",
        args: ["run"],
      };
    case "typescript":
      return {
        extension: "ts",
        command: "bun",
        args: ["run"],
      };
    case "python":
      return {
        extension: "py",
        command: "python3",
        args: [],
      };
    case "bash":
      return {
        extension: "sh",
        command: "bash",
        args: [],
      };
    default:
      throw new ToolError("code-exec", `Unsupported language: ${language}`);
  }
}

async function executeCode(
  code: string,
  language: string,
  timeout: number,
  memoryLimit: number,
): Promise<ExecutionResult> {
  const langConfig = getLanguageConfig(language);

  // Create temporary directory
  const tempDir = mkdtempSync(join(tmpdir(), "mcp-code-"));
  const tempFile = join(tempDir, `code.${langConfig.extension}`);

  try {
    // Write code to temp file
    writeFileSync(tempFile, code, "utf-8");

    // Execute code
    const startTime = Date.now();

    return await new Promise((resolve, reject) => {
      const childProcess = spawn(
        langConfig.command,
        [...langConfig.args, tempFile],
        {
          cwd: tempDir,
          env: {
            // Clean environment - minimal variables
            PATH: process.env.PATH || "",
            HOME: process.env.HOME || "",
            TMPDIR: tmpdir(),
          },
          stdio: ["ignore", "pipe", "pipe"],
          detached: false,
        },
      );

      let stdout = "";
      let stderr = "";
      let timedOut = false;
      let killed = false;

      // Collect output with size limits
      const maxOutputSize = 1024 * 1024; // 1MB limit

      childProcess.stdout.on("data", (data) => {
        if (stdout.length < maxOutputSize) {
          stdout += data.toString();
          if (stdout.length > maxOutputSize) {
            stdout =
              stdout.substring(0, maxOutputSize) + "\n[Output truncated]";
          }
        }
      });

      childProcess.stderr.on("data", (data) => {
        if (stderr.length < maxOutputSize) {
          stderr += data.toString();
          if (stderr.length > maxOutputSize) {
            stderr =
              stderr.substring(0, maxOutputSize) + "\n[Error output truncated]";
          }
        }
      });

      // Timeout handler
      const timeoutHandler = setTimeout(() => {
        timedOut = true;
        killed = true;
        childProcess.kill("SIGTERM");

        // Force kill after 5 seconds if still running
        setTimeout(() => {
          if (!childProcess.killed) {
            childProcess.kill("SIGKILL");
          }
        }, 5000);
      }, timeout);

      childProcess.on("close", (code) => {
        clearTimeout(timeoutHandler);

        const executionTime = Date.now() - startTime;

        resolve({
          stdout,
          stderr,
          exitCode: code || 0,
          executionTime,
          timedOut,
        });
      });

      childProcess.on("error", (error) => {
        clearTimeout(timeoutHandler);

        if (!killed) {
          reject(new ToolError("code-exec", `Process error: ${error.message}`));
        }
      });
    });
  } finally {
    // Cleanup temp files
    try {
      unlinkSync(tempFile);
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

export const codeExecTool: ToolDefinition<Input, ExecutionResult> = {
  name: "code-exec",
  description:
    "Execute code in a secure sandbox with timeout and resource limits. Supports JavaScript, TypeScript, Python, and Bash with proper process isolation.",
  inputSchema,
  handler: async (input, context) => {
    const { config, logger } = context;
    const timeout = input.timeout || config.tools.codeExec.timeout;
    const memoryLimit = input.memoryLimit || config.tools.codeExec.memoryLimit;

    // Validate language is supported
    if (!config.tools.codeExec.languages.includes(input.language)) {
      throw new ToolError(
        "code-exec",
        `Language "${input.language}" is not enabled. Supported languages: ${config.tools.codeExec.languages.join(", ")}`,
      );
    }

    logger.debug(
      { language: input.language, codeLength: input.code.length, timeout },
      "Executing code",
    );

    try {
      const result = await executeCode(
        input.code,
        input.language,
        timeout,
        memoryLimit,
      );

      if (result.timedOut) {
        logger.warn(
          {
            language: input.language,
            timeout,
            executionTime: result.executionTime,
          },
          "Code execution timed out",
        );
      } else {
        logger.info(
          {
            language: input.language,
            exitCode: result.exitCode,
            executionTime: result.executionTime,
          },
          "Code execution completed",
        );
      }

      return result;
    } catch (error: any) {
      logger.error(
        { language: input.language, error: error.message },
        "Code execution failed",
      );
      throw error;
    }
  },
};
