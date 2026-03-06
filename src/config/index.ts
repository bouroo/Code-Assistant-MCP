import { config } from "dotenv";
import { existsSync } from "fs";
import { join, resolve } from "path";
import { configSchema, type Config } from "./schema";
import { defaults } from "./defaults";

export async function loadConfig(): Promise<Config> {
  // Load .env file
  config();

  // Try to load config file
  let fileConfig: Partial<Config> = {};
  const configPath = join(process.cwd(), "config", "mcp-config.json");

  if (existsSync(configPath)) {
    try {
      const file = Bun.file(configPath);
      const content = await file.text();
      // Only parse if content is not empty
      if (content.trim()) {
        fileConfig = JSON.parse(content);
      }
    } catch (error) {
      console.warn(`Failed to load config file: ${configPath}`, error);
      // Continue with empty fileConfig - defaults will be used
      fileConfig = {};
    }
  }

  // Parse allowed directories from env
  const allowedDirs = process.env.MCP_ALLOWED_DIRS
    ? process.env.MCP_ALLOWED_DIRS.split(",").map((d) => d.trim())
    : undefined;

  // Merge with priority: env vars > file config > defaults
  const mergedConfig: Config = {
    server: {
      name:
        process.env.MCP_SERVER_NAME ||
        fileConfig.server?.name ||
        defaults.server.name,
      version:
        process.env.MCP_SERVER_VERSION ||
        fileConfig.server?.version ||
        defaults.server.version,
      description:
        fileConfig.server?.description || defaults.server.description,
    },

    transport: {
      stdio:
        process.env.MCP_TRANSPORT_STDIO === "true" ||
        fileConfig.transport?.stdio ||
        defaults.transport.stdio,
      http: {
        enabled:
          process.env.MCP_TRANSPORT_HTTP === "true" ||
          fileConfig.transport?.http?.enabled ||
          defaults.transport.http.enabled,
        port:
          parseInt(process.env.MCP_HTTP_PORT || "") ||
          fileConfig.transport?.http?.port ||
          defaults.transport.http.port,
        host:
          process.env.MCP_HTTP_HOST ||
          fileConfig.transport?.http?.host ||
          defaults.transport.http.host,
        auth: {
          enabled:
            process.env.MCP_HTTP_AUTH_ENABLED === "true" ||
            fileConfig.transport?.http?.auth?.enabled ||
            defaults.transport.http.auth.enabled,
          apiKey:
            process.env.MCP_HTTP_API_KEY ||
            fileConfig.transport?.http?.auth?.apiKey,
        },
      },
    },

    tools: {
      webSearch: {
        enabled:
          fileConfig.tools?.webSearch?.enabled ??
          defaults.tools.webSearch.enabled,
        timeout:
          fileConfig.tools?.webSearch?.timeout ??
          defaults.tools.webSearch.timeout,
        maxResults:
          fileConfig.tools?.webSearch?.maxResults ??
          defaults.tools.webSearch.maxResults,
      },

      docSearch: {
        enabled:
          fileConfig.tools?.docSearch?.enabled ??
          defaults.tools.docSearch.enabled,
        githubToken:
          process.env.GITHUB_TOKEN || fileConfig.tools?.docSearch?.githubToken,
        timeout:
          fileConfig.tools?.docSearch?.timeout ??
          defaults.tools.docSearch.timeout,
        maxResults:
          fileConfig.tools?.docSearch?.maxResults ??
          defaults.tools.docSearch.maxResults,
      },

      webReader: {
        enabled:
          fileConfig.tools?.webReader?.enabled ??
          defaults.tools.webReader.enabled,
        timeout:
          fileConfig.tools?.webReader?.timeout ??
          defaults.tools.webReader.timeout,
        maxSize:
          fileConfig.tools?.webReader?.maxSize ??
          defaults.tools.webReader.maxSize,
      },

      codeExec: {
        enabled:
          fileConfig.tools?.codeExec?.enabled ??
          defaults.tools.codeExec.enabled,
        timeout:
          fileConfig.tools?.codeExec?.timeout ??
          defaults.tools.codeExec.timeout,
        memoryLimit:
          fileConfig.tools?.codeExec?.memoryLimit ??
          defaults.tools.codeExec.memoryLimit,
        languages:
          fileConfig.tools?.codeExec?.languages ??
          defaults.tools.codeExec.languages,
      },

      fileOps: {
        enabled:
          fileConfig.tools?.fileOps?.enabled ?? defaults.tools.fileOps.enabled,
        allowedDirectories:
          allowedDirs ||
          fileConfig.tools?.fileOps?.allowedDirectories ||
          defaults.tools.fileOps.allowedDirectories,
        maxSize:
          fileConfig.tools?.fileOps?.maxSize ?? defaults.tools.fileOps.maxSize,
      },
    },

    security: {
      rateLimit: {
        enabled:
          fileConfig.security?.rateLimit?.enabled ??
          defaults.security.rateLimit.enabled,
        windowMs:
          fileConfig.security?.rateLimit?.windowMs ??
          defaults.security.rateLimit.windowMs,
        maxRequests:
          fileConfig.security?.rateLimit?.maxRequests ??
          defaults.security.rateLimit.maxRequests,
      },
    },

    logging: {
      level:
        (process.env.LOG_LEVEL as any) ||
        fileConfig.logging?.level ||
        defaults.logging.level,
      prettyPrint:
        fileConfig.logging?.prettyPrint ?? defaults.logging.prettyPrint,
      file: {
        enabled:
          fileConfig.logging?.file?.enabled ?? defaults.logging.file.enabled,
        path: fileConfig.logging?.file?.path || defaults.logging.file.path,
        maxSize:
          fileConfig.logging?.file?.maxSize ?? defaults.logging.file.maxSize,
        maxFiles:
          fileConfig.logging?.file?.maxFiles ?? defaults.logging.file.maxFiles,
      },
    },
  };

  // Validate with Zod
  const result = configSchema.safeParse(mergedConfig);

  if (!result.success) {
    console.error("Configuration validation failed:", result.error.format());
    throw new Error(`Invalid configuration: ${result.error.message}`);
  }

  return result.data;
}
