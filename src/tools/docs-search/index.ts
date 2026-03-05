import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { docsSearchHandler } from "./handler.js";
import { DocsSearchInputSchema } from "./schema.js";
import type { DocsSearchInput } from "./types.js";

export function registerDocsSearchTool(server: McpServer): void {
  server.registerTool(
    "docs_search",
    {
      title: "Documentation Search",
      description:
        "Search documentation, code, and issues in GitHub repositories. Supports code search, issue search, and README retrieval.",
      inputSchema: DocsSearchInputSchema,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (args: any) => {
      const input = DocsSearchInputSchema.parse(args) as DocsSearchInput;
      const result = await docsSearchHandler(input);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      } as any;
    },
  );
}
