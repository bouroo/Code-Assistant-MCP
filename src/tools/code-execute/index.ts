import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { codeExecuteHandler } from './handler.js';
import { CodeExecuteInputSchema } from './schema.js';
import type { CodeExecuteInput } from './types.js';

export function registerCodeExecuteTool(server: McpServer): void {
  server.registerTool(
    'code_execute',
    {
      title: 'Code Execute',
      description: 'Execute code snippets in a sandboxed environment. Supports JavaScript, TypeScript, Python, Bash, and SQL. Returns stdout, stderr, and execution metadata.',
      inputSchema: CodeExecuteInputSchema
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (args: any) => {
      const input = CodeExecuteInputSchema.parse(args) as CodeExecuteInput;
      const result = await codeExecuteHandler(input);
      return {
        content: [{ type: 'text', text: JSON.stringify(result) }]
      } as any;
    }
  );
}
