import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { fileOperationsHandler } from './handler.js';
import { FileOperationsInputSchema } from './schema.js';
import type { FileOperationsInput } from './types.js';

export function registerFileOperationsTool(server: McpServer): void {
  server.registerTool(
    'file_operations',
    {
      title: 'File Operations',
      description: 'Perform file system operations safely. Supports read, write, list, delete, exists, and stat operations with path validation against allowed directories.',
      inputSchema: FileOperationsInputSchema
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (args: any) => {
      const input = FileOperationsInputSchema.parse(args) as FileOperationsInput;
      const result = await fileOperationsHandler(input);
      return {
        content: [{ type: 'text', text: JSON.stringify(result) }]
      } as any;
    }
  );
}
