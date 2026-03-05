import { spawn } from "child_process";
import { writeFile, mkdir, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { logger } from "../../utils/logger.js";
import type { CodeExecuteInput, CodeExecuteOutput } from "./types.js";

export async function codeExecuteHandler(
  input: CodeExecuteInput,
): Promise<CodeExecuteOutput> {
  logger.info("Code execute request", {
    language: input.language,
    codeLength: input.code.length,
  });

  const timeoutMs = (input.timeout ?? 10) * 1000;
  const tmpDir = join(tmpdir(), `coder-agent-${Date.now()}`);

  try {
    // Create temp directory
    await mkdir(tmpDir, { recursive: true });

    // Write files if provided
    if (input.files) {
      for (const [filename, content] of Object.entries(input.files)) {
        await writeFile(join(tmpDir, filename), content);
      }
    }

    // Get the command based on language
    const { command, args, filename } = getCommandConfig(
      input.language,
      input.code,
      tmpDir,
    );

    // Write main code file
    await writeFile(join(tmpDir, filename), input.code);

    // Execute the code
    const result = await executeCommand(
      command,
      args,
      input.input,
      timeoutMs,
      tmpDir,
    );

    return {
      ...result,
      language: input.language,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      stdout: "",
      stderr: errorMessage,
      exitCode: 1,
      executionTime: 0,
      language: input.language,
      success: false,
      error: {
        type: error instanceof Error ? error.name : "Error",
        message: errorMessage,
      },
    };
  } finally {
    // Clean up temp directory
    try {
      await rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

function getCommandConfig(
  language: string,
  code: string,
  tmpDir: string,
): {
  command: string;
  args: string[];
  filename: string;
} {
  switch (language) {
    case "javascript":
      return {
        command: "node",
        args: [join(tmpDir, "main.js")],
        filename: "main.js",
      };

    case "typescript":
      // For TypeScript, we use tsx to execute directly
      return {
        command: "npx",
        args: ["tsx", join(tmpDir, "main.ts")],
        filename: "main.ts",
      };

    case "python":
      return {
        command: "python3",
        args: [join(tmpDir, "main.py")],
        filename: "main.py",
      };

    case "bash":
      return {
        command: "bash",
        args: [join(tmpDir, "script.sh")],
        filename: "script.sh",
      };

    case "sql":
      // SQL execution requires a database connection - not supported in sandboxed execution
      throw new Error(
        "SQL execution is not supported. This tool executes code in the host environment, not against databases.",
      );

    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

function executeCommand(
  command: string,
  args: string[],
  input?: string,
  timeoutMs?: number,
  cwd?: string,
): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  success: boolean;
  error?: {
    type: string;
    message: string;
    line?: number;
  };
}> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    // Security: Only pass minimal environment variables
    // This is NOT a sandbox - code runs with the same permissions as the Node.js process
    const safeEnv: Record<string, string> = {
      PATH: process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin",
      HOME: process.env.HOME ?? "/tmp",
      TMPDIR: process.env.TMPDIR ?? "/tmp",
      // Pass through common locale variables
      LANG: process.env.LANG ?? "en_US.UTF-8",
      LC_ALL: process.env.LC_ALL ?? "en_US.UTF-8",
    };

    const proc = spawn(command, args, {
      cwd,
      env: safeEnv,
      shell: false,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (data) => {
      stdout += data.toString();
      // Limit output size
      if (stdout.length > 500000) {
        stdout = stdout.slice(0, 500000) + "\n... (output truncated)";
        proc.kill();
      }
    });

    proc.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    // Send input if provided
    if (input) {
      proc.stdin?.write(input);
      proc.stdin?.end();
    }

    // Set timeout
    const timeout = setTimeout(() => {
      proc.kill();
      stderr += `\nExecution timed out after ${timeoutMs}ms`;
    }, timeoutMs);

    proc.on("close", (code) => {
      clearTimeout(timeout);
      const executionTime = Date.now() - startTime;

      resolve({
        stdout,
        stderr,
        exitCode: code ?? 1,
        executionTime,
        success: code === 0,
        error:
          code !== 0
            ? {
                type: "ExecutionError",
                message: stderr || "Process exited with non-zero code",
              }
            : undefined,
      });
    });

    proc.on("error", (error) => {
      clearTimeout(timeout);
      const executionTime = Date.now() - startTime;

      resolve({
        stdout,
        stderr: error.message,
        exitCode: 1,
        executionTime,
        success: false,
        error: {
          type: error.name,
          message: error.message,
        },
      });
    });
  });
}
