import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Config } from "./config/schema.js";
import type { Logger } from "./utils/logger.js";
import { tools } from "./tools/index.js";
import { createHTTPTransport } from "./transports/http.js";
import { MCPError } from "./types/errors.js";

export async function createMCPServer(
  config: Config,
  logger: Logger,
): Promise<Server> {
  const server = new Server(
    {
      name: config.server.name,
      version: config.server.version,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Register tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const enabledTools = tools.filter((tool) => {
      const toolConfig = config.tools[tool.name as keyof typeof config.tools];
      return !("enabled" in toolConfig) || toolConfig.enabled;
    });

    return {
      tools: enabledTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: zodToJsonSchema(tool.inputSchema),
      })),
    };
  });

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    logger.info({ tool: name, args }, "Tool invoked");

    const tool = tools.find((t) => t.name === name);

    if (!tool) {
      logger.error({ tool: name }, "Tool not found");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: `Tool "${name}" not found`,
            }),
          },
        ],
        isError: true,
      };
    }

    // Check if tool is enabled
    const toolConfig = config.tools[tool.name as keyof typeof config.tools];
    if ("enabled" in toolConfig && !toolConfig.enabled) {
      logger.warn({ tool: name }, "Tool is disabled");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: `Tool "${name}" is disabled`,
            }),
          },
        ],
        isError: true,
      };
    }

    try {
      // Validate input
      const validatedInput = tool.inputSchema.parse(args);

      // Execute tool
      const context = { config, logger };
      const result = await tool.handler(validatedInput, context);

      logger.info({ tool: name }, "Tool execution successful");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error: any) {
      logger.error(
        { tool: name, error: error.message },
        "Tool execution failed",
      );

      let errorMessage = error.message;
      let errorCode = "TOOL_ERROR";

      if (error instanceof MCPError) {
        errorCode = error.code;
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: errorMessage,
              code: errorCode,
            }),
          },
        ],
        isError: true,
      };
    }
  });

  // Setup error handler
  server.onerror = (error) => {
    logger.error({ error: error.message }, "MCP server error");
  };

  return server;
}

export async function startServer(
  config: Config,
  logger: Logger,
): Promise<void> {
  const server = await createMCPServer(config, logger);

  const transports: Promise<any>[] = [];

  if (config.transport.stdio) {
    logger.info("Starting stdio transport");
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info("Stdio transport connected");
  }

  if (config.transport.http.enabled) {
    transports.push(createHTTPTransport(server, config, logger));
  }

  // Graceful shutdown
  const shutdown = async () => {
    logger.info("Shutting down MCP server...");
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Wait for all transports
  if (transports.length > 0) {
    await Promise.all(transports);
  }

  logger.info("MCP server started successfully");
}
