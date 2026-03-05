export interface CodeExecuteInput {
  code: string;
  language: "javascript" | "typescript" | "python" | "bash" | "sql";
  timeout?: number;
  input?: string;
  files?: Record<string, string>;
}

export interface CodeExecuteOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  language: string;
  success: boolean;
  error?: {
    type: string;
    message: string;
    line?: number;
  };
}
