import { loadConfig } from "./config";
import { createLogger } from "./utils/logger";
import { startServer } from "./server";

async function main() {
  try {
    // Load configuration
    const config = await loadConfig();

    // Create logger
    const logger = createLogger(config);

    logger.info(
      {
        name: config.server.name,
        version: config.server.version,
        transports: {
          stdio: config.transport.stdio,
          http: config.transport.http.enabled,
        },
      },
      "Starting MCP server",
    );

    // Start server
    await startServer(config, logger);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Run main
main();
