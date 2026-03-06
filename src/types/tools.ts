import type { ZodTypeAny } from "zod";
import type { Config } from "../config/schema";
import type { Logger } from "../utils/logger";

export interface ToolContext {
  config: Config;
  logger: Logger;
}

export interface ToolDefinition<TInput = any, TOutput = any> {
  name: string;
  description: string;
  inputSchema: ZodTypeAny;
  handler: (input: TInput, context: ToolContext) => Promise<TOutput>;
}

export type ToolRegistry = Map<string, ToolDefinition>;

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}
