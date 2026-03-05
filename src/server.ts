import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config/index.js";
import { logger } from "./utils/logger.js";

// Import tool registrations
import { registerWebSearchTool } from "./tools/web-search/index.js";
import { registerDocsSearchTool } from "./tools/docs-search/index.js";
import { registerWebReaderTool } from "./tools/web-reader/index.js";
import { registerCodeExecuteTool } from "./tools/code-execute/index.js";
import { registerFileOperationsTool } from "./tools/file-operations/index.js";

export async function createServer(): Promise<McpServer> {
  const config = loadConfig();

  // Set log level from config
  logger.setLevel(config.logging.level);

  // Create MCP server instance
  const server = new McpServer(
    {
      name: "coder-agent-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Register all tools
  registerWebSearchTool(server);
  registerDocsSearchTool(server);
  registerWebReaderTool(server);
  registerCodeExecuteTool(server);
  registerFileOperationsTool(server);

  logger.info("MCP server initialized", {
    name: "coder-agent-mcp",
    version: "1.0.0",
  });

  return server;
}

export async function startServer(): Promise<void> {
  const server = await createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  logger.info("MCP server started on stdio transport");
}
