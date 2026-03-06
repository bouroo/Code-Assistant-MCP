# Code Assistant MCP Server

A production-ready Model Context Protocol (MCP) server that provides AI assistants with comprehensive tooling capabilities for performing real-world coding tasks.

## Features

- **Web Search Tool**: DuckDuckGo integration for searching documentation, tutorials, and technical information
- **Documentation Search Tool**: GitHub repository search for code, documentation, and README files
- **Web Reader Tool**: Fetch and parse webpages into clean markdown or plain text format
- **Code Execution Tool**: Secure multi-language sandbox (JavaScript, TypeScript, Python, Bash)
- **File Operations Tool**: Safe file management with path validation and security controls

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) >= 1.0.0
- GitHub token (optional, for higher rate limits)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd code-assistant-mcp

# Install dependencies
bun install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# (Optional) Add your GitHub token for higher API rate limits
```

### Running the Server

```bash
# Development mode with hot reload
bun run dev

# Production mode
bun run start

# Run tests
bun run test

# Run tests with coverage
bun run test:coverage
```

## Configuration

Configuration can be provided through:

1. Environment variables (highest priority)
2. Configuration file (`config/mcp-config.json`)
3. Default values (lowest priority)

### Environment Variables

See `.env.example` for all available options:

```bash
# Server settings
MCP_SERVER_NAME=code-assistant-mcp
MCP_SERVER_VERSION=1.0.0

# Transport settings
MCP_TRANSPORT_STDIO=true
MCP_TRANSPORT_HTTP=false
MCP_HTTP_PORT=3000

# GitHub token for doc-search tool
GITHUB_TOKEN=ghp_your_token_here

# HTTP authentication (optional)
MCP_HTTP_AUTH_ENABLED=false
MCP_HTTP_API_KEY=your_api_key_here

# Logging
LOG_LEVEL=info

# Allowed directories for file operations
MCP_ALLOWED_DIRS=/path/to/project1,/path/to/project2
```

### Configuration File

See `config/mcp-config.json` for detailed configuration options.

## Tools

### 1. Web Search (`web-search`)

Search the web using DuckDuckGo for documentation, tutorials, and technical information.

**Parameters:**

- `query` (string, required): Search query
- `maxResults` (number, optional): Max results to return (1-50, default: 10)

**Example:**

```json
{
  "query": "TypeScript async await tutorial",
  "maxResults": 5
}
```

### 2. Documentation Search (`doc-search`)

Search GitHub repositories for code, documentation, and README files.

**Parameters:**

- `query` (string, required): Search query
- `type` (enum, optional): Search type - `code`, `repos`, or `files` (default: `code`)
- `repository` (string, optional): Specific repository (format: `owner/repo`)
- `language` (string, optional): Filter by programming language
- `maxResults` (number, optional): Max results to return (1-100, default: 20)

**Example:**

```json
{
  "query": "express middleware",
  "type": "code",
  "language": "typescript",
  "maxResults": 10
}
```

### 3. Web Reader (`web-reader`)

Fetch and parse webpages into clean markdown or plain text format.

**Parameters:**

- `url` (string, required): URL to fetch
- `format` (enum, optional): Output format - `markdown` or `text` (default: `markdown`)
- `timeout` (number, optional): Request timeout in milliseconds
- `maxWidth` (number, optional): Max line width for text format (default: 80)

**Example:**

```json
{
  "url": "https://example.com/docs",
  "format": "markdown"
}
```

### 4. Code Execution (`code-exec`)

Execute code in a secure sandbox with timeout and resource limits.

**Parameters:**

- `code` (string, required): Code to execute (max 1MB)
- `language` (enum, required): Programming language - `javascript`, `typescript`, `python`, or `bash`
- `timeout` (number, optional): Execution timeout in milliseconds (1s - 2min)
- `memoryLimit` (number, optional): Memory limit in MB (16MB - 1GB)

**Example:**

```json
{
  "code": "console.log('Hello, World!');",
  "language": "javascript",
  "timeout": 30000
}
```

### 5. File Operations (`file-ops`)

Perform file operations with strict path validation and security controls.

**Parameters:**

- `operation` (enum, required): Operation type - `read`, `write`, `append`, `list`, `mkdir`, `copy`, `move`, `delete`
- `path` (string, required): File or directory path
- `content` (string, optional): Content for write/append operations
- `destination` (string, optional): Destination path for copy/move operations
- `encoding` (enum, optional): File encoding - `utf-8`, `binary`, or `base64` (default: `utf-8`)
- `recursive` (boolean, optional): Recursive operation for directories

**Examples:**

Read a file:

```json
{
  "operation": "read",
  "path": "src/index.ts"
}
```

Write a file:

```json
{
  "operation": "write",
  "path": "output.txt",
  "content": "Hello, World!"
}
```

List directory:

```json
{
  "operation": "list",
  "path": "src"
}
```

## Security

### Path Validation

All file operations are restricted to allowed directories (configured via `MCP_ALLOWED_DIRS` or `config.tools.fileOps.allowedDirectories`). Path traversal attempts (e.g., `../../../etc/passwd`) are blocked.

### Code Execution

Code execution runs in isolated child processes with:

- Configurable timeouts (default: 30s)
- Memory limits (default: 256MB)
- Clean environment (no inherited env vars)
- Output size limits (1MB)

### Rate Limiting

HTTP transport includes rate limiting (default: 100 requests/minute per client IP).

### Authentication

Optional API key authentication for HTTP transport:

```bash
MCP_HTTP_AUTH_ENABLED=true
MCP_HTTP_API_KEY=your_secret_key
```

Include the key in requests:

```
Authorization: Bearer your_secret_key
```

## Transports

### Stdio (Default)

For local integration with Claude Desktop, Cursor, and other MCP clients:

```bash
bun run start
```

### HTTP

For remote access and web-based clients:

```bash
# Enable HTTP in .env
MCP_TRANSPORT_HTTP=true
MCP_HTTP_PORT=3000

# Start server
bun run start
```

Endpoints:

- `POST /mcp` - MCP protocol endpoint
- `GET /health` - Health check

## Development

```bash
# Run with hot reload
bun run dev

# Run tests
bun run test

# Run tests in watch mode
bun run test:watch

# Type check
bun run lint

# Build for production
bun run build
```

## Project Structure

```
code-assistant-mcp/
├── src/
│   ├── config/          # Configuration management
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── tools/           # Tool implementations
│   ├── transports/      # Transport implementations
│   ├── middleware/      # Middleware (rate limiting, etc.)
│   ├── server.ts        # MCP server setup
│   └── index.ts         # Entry point
├── tests/
│   ├── unit/            # Unit tests
│   └── integration/     # Integration tests
├── config/
│   └── mcp-config.json  # Configuration file
├── logs/                # Log files
├── .env                 # Environment variables
└── package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please use the GitHub issue tracker.

## Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) - The protocol specification
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - Official SDK
- [Bun](https://bun.sh) - Fast JavaScript runtime
