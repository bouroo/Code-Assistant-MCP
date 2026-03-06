import type { ToolDefinition } from "../types/tools";
import { webSearchTool } from "./web-search";
import { docSearchTool } from "./doc-search";
import { webReaderTool } from "./web-reader";
import { codeExecTool } from "./code-exec";
import { fileOpsTool } from "./file-ops";

export const tools: ToolDefinition[] = [
  webSearchTool,
  docSearchTool,
  webReaderTool,
  codeExecTool,
  fileOpsTool,
];

export function getToolByName(name: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.name === name);
}

export function getAllTools(): ToolDefinition[] {
  return [...tools];
}
