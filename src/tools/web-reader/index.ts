import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { webReaderHandler } from './handler.js';
import { WebReaderInputSchema } from './schema.js';
import type { WebReaderInput } from './types.js';

export function registerWebReaderTool(server: McpServer): void {
  server.registerTool(
    'web_reader',
    {
      title: 'Web Reader',
      description: 'Fetch and parse complete content of any webpage. Returns content in various formats (markdown, text, or JSON) with optional metadata, links, and images summaries.',
      inputSchema: WebReaderInputSchema
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (args: any) => {
      const input = WebReaderInputSchema.parse(args) as WebReaderInput;
      const result = await webReaderHandler(input);
      return {
        content: [{ type: 'text', text: JSON.stringify(result) }]
      } as any;
    }
  );
}
