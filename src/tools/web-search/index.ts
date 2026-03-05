import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { webSearchHandler } from "./handler.js";
import { WebSearchInputSchema } from "./schema.js";
import type { WebSearchInput } from "./types.js";

export function registerWebSearchTool(server: McpServer): void {
  server.registerTool(
    "web_search",
    {
      title: "Web Search",
      description:
        "Search the web using DuckDuckGo to retrieve latest information, news, and general web content. Returns structured results with titles, links, and snippets.",
      inputSchema: WebSearchInputSchema,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (args: any) => {
      const input = WebSearchInputSchema.parse(args) as WebSearchInput;
      const result = await webSearchHandler(input);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      } as any;
    },
  );
}
