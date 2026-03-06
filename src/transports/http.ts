import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { Config } from "../config/schema.js";
import type { Logger } from "../utils/logger.js";
import { RateLimiter } from "../middleware/rate-limiter.js";

export async function createHTTPTransport(
  server: Server,
  config: Config,
  logger: Logger,
): Promise<ReturnType<typeof Bun.serve>> {
  // Initialize rate limiter
  const rateLimiter = new RateLimiter(
    config.security.rateLimit.windowMs,
    config.security.rateLimit.maxRequests,
    logger,
  );

  const httpServer = Bun.serve({
    port: config.transport.http.port,
    hostname: config.transport.http.host,

    async fetch(req) {
      const url = new URL(req.url);
      const clientIP =
        req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        "unknown";

      // CORS headers
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };

      // Handle preflight requests
      if (req.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: corsHeaders,
        });
      }

      // Health check endpoint
      if (url.pathname === "/health") {
        return new Response(
          JSON.stringify({
            status: "ok",
            server: config.server.name,
            version: config.server.version,
            timestamp: new Date().toISOString(),
          }),
          {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }

      // MCP endpoint
      if (url.pathname === "/mcp" && req.method === "POST") {
        try {
          // Check authentication if enabled
          if (config.transport.http.auth.enabled) {
            const authHeader = req.headers.get("Authorization");
            const token = authHeader?.replace("Bearer ", "");

            if (token !== config.transport.http.auth.apiKey) {
              logger.warn({ clientIP }, "Unauthorized request");
              return new Response(
                JSON.stringify({
                  jsonrpc: "2.0",
                  error: {
                    code: -32001,
                    message: "Unauthorized",
                  },
                  id: null,
                }),
                {
                  status: 401,
                  headers: {
                    "Content-Type": "application/json",
                    ...corsHeaders,
                  },
                },
              );
            }
          }

          // Rate limiting
          if (config.security.rateLimit.enabled) {
            try {
              rateLimiter.checkLimit(clientIP);
            } catch (error: any) {
              return new Response(
                JSON.stringify({
                  jsonrpc: "2.0",
                  error: {
                    code: -32002,
                    message: error.message,
                  },
                  id: null,
                }),
                {
                  status: 429,
                  headers: {
                    "Content-Type": "application/json",
                    "Retry-After": String(
                      Math.ceil(config.security.rateLimit.windowMs / 1000),
                    ),
                    ...corsHeaders,
                  },
                },
              );
            }
          }

          // Parse request body
          let body;
          try {
            body = await req.json();
          } catch (error) {
            return new Response(
              JSON.stringify({
                jsonrpc: "2.0",
                error: {
                  code: -32700,
                  message: "Parse error",
                },
                id: null,
              }),
              {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              },
            );
          }

          // Handle MCP request
          const requestBody = body as { method?: string; id?: string | number };
          logger.debug(
            { method: requestBody.method, id: requestBody.id },
            "MCP request received",
          );

          try {
            // @ts-ignore - handleRequest is available on Server
            const response = await server.handleRequest(body);

            return new Response(JSON.stringify(response), {
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          } catch (error: any) {
            logger.error(
              { error: error.message, method: requestBody.method },
              "MCP request failed",
            );

            return new Response(
              JSON.stringify({
                jsonrpc: "2.0",
                error: {
                  code: -32603,
                  message: error.message || "Internal error",
                },
                id: requestBody.id || null,
              }),
              {
                status: 500,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              },
            );
          }
        } catch (error: any) {
          logger.error({ error: error.message }, "HTTP transport error");

          return new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              error: {
                code: -32603,
                message: "Internal server error",
              },
              id: null,
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }
      }

      // 404 for unknown routes
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: `Route ${url.pathname} not found`,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    },

    error(error) {
      logger.error({ error: error.message }, "HTTP server error");
      return new Response("Internal Server Error", { status: 500 });
    },
  });

  logger.info(
    { port: httpServer.port, host: config.transport.http.host },
    "HTTP server started",
  );

  return httpServer;
}
