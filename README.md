# Coder Agent MCP Server

A lightweight Model Context Protocol (MCP) server that provides AI coding assistants with powerful tools for web search, documentation lookup, code execution, and file operations. Built with TypeScript and the official MCP SDK.

## Description

This MCP server enables AI assistants like Claude and Cursor to perform real-world coding tasks by exposing a comprehensive set of tools:

- **Web Search** — Search the web using DuckDuckGo for latest documentation, tutorials, and technical information
- **Docs Search** — Search GitHub repositories for code, issues, discussions, and README files
- **Web Reader** — Fetch and parse webpages into clean markdown or text format
- **Code Execution** — Run code in multiple languages with configurable timeouts
- **File Operations** — Safely read, write, list, and manage files within allowed directories

## Features

| Tool | Description |
|------|-------------|
| **web_search** | Search the web using DuckDuckGo API with region filtering, safe search options, and time range selection |
| **docs_search** | Search GitHub repositories for code, issues, discussions, or README content with syntax highlighting |
| **web_reader** | Fetch webpages and convert to markdown, text, or JSON with metadata extraction |
| **code_execute** | Execute JavaScript, TypeScript, Python, Bash, or SQL code in a sandboxed environment |
| **file_operations** | Perform file system operations (read, write, list, delete, exists, stat) within allowed paths |

## Installation

### Prerequisites

- Node.js >= 20.0.0
- npm or yarn

### Steps

1. **Clone the repository**

   ```bash
   cd coder-agent-mcp
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Copy the environment configuration**

   ```bash
   cp .env.example .env
   ```

4. **Configure your environment**

   Edit the `.env` file with your preferred settings (see Configuration section below).

5. **Build the project**

   ```bash
   npm run build
   ```

6. **Start the server**

   ```bash
   npm start
   ```

## Configuration

All configuration is done via environment variables. Copy `.env.example` to `.env` and modify as needed.

### GitHub Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `GITHUB_TOKEN` | string | — | Optional GitHub API token for higher rate limits. Get one at https://github.com/settings/tokens |

### Logging Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `LOG_LEVEL` | enum | `info` | Log level: `debug`, `info`, `warn`, `error` |

### Rate Limiting

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `RATE_LIMIT_REQUESTS` | number | `100` | Maximum requests allowed per window |
| `RATE_LIMIT_WINDOW_MS` | number | `60000` | Rate limit window in milliseconds (default: 1 minute) |

### HTTP Fetcher Settings

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `FETCH_TIMEOUT_MS` | number | `30000` | HTTP request timeout in milliseconds |
| `FETCH_RETRIES` | number | `3` | Number of retry attempts for failed requests |

### Code Execution Sandbox

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `SANDBOX_ENABLED` | boolean | `true` | Enable or disable code execution |
| `SANDBOX_TIMEOUT_MS` | number | `10000` | Maximum execution time in milliseconds |

### File Operations

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `ALLOWED_PATHS` | string | `.,/tmp` | Comma-separated list of allowed base paths for file operations |

## Usage with Claude Desktop

To use this MCP server with Claude Desktop, add it to your Claude configuration:

1. Open Claude Desktop settings
2. Navigate to Developer > Edit Config
3. Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "coder-agent-mcp": {
      "command": "node",
      "args": ["/path/to/coder-agent-mcp/dist/index.js"],
      "env": {
        "LOG_LEVEL": "info",
        "ALLOWED_PATHS": ".,/tmp"
      }
    }
  }
}
```

Replace `/path/to/coder-agent-mcp` with the actual path to your installation.

## Usage with Cursor

To use this MCP server with Cursor:

1. Open Cursor settings
2. Navigate to Features > MCP Servers
3. Add a new MCP server with the following configuration:

```json
{
  "command": "node",
  "args": ["/path/to/coder-agent-mcp/dist/index.js"],
  "env": {
    "LOG_LEVEL": "info",
    "ALLOWED_PATHS": ".,/tmp"
  }
}
```

## Tool Reference

### web_search

Search the web using DuckDuckGo.

```typescript
// Example input
{
  query: "TypeScript generics tutorial",
  maxResults: 10,
  region: "us-en",
  safeSearch: "moderate",
  timeRange: "month"
}
```

### docs_search

Search GitHub repositories for code, issues, discussions, or README files.

```typescript
// Example input - search code
{
  repoName: "microsoft/vscode",
  query: "function getWorkspaceFolder",
  searchType: "code"
}

// Example input - search issues
{
  repoName: "facebook/react",
  query: "memory leak useEffect",
  searchType: "issues"
}
```

### web_reader

Fetch and parse webpages into various formats.

```typescript
// Example input
{
  url: "https://www.typescriptlang.org/docs/handbook/2/generics.html",
  returnFormat: "markdown",
  retainImages: true,
  withLinksSummary: true,
  timeout: 30
}
```

### code_execute

Execute code in a sandboxed environment.

```typescript
// Example input - JavaScript
{
  code: "const sum = (a, b) => a + b;\nconsole.log(sum(2, 3));",
  language: "javascript",
  timeout: 10
}

// Example input - Python
{
  code: "def fib(n):\n    if n <= 1:\n        return n\n    return fib(n-1) + fib(n-2)\nprint(fib(10))",
  language: "python",
  timeout: 10
}
```

### file_operations

Perform file system operations on allowed paths.

```typescript
// Read a file
{
  operation: "read",
  path: "./src/index.ts",
  encoding: "utf-8"
}

// Write to a file
{
  operation: "write",
  path: "./output.txt",
  content: "Hello, World!"
}

// List directory contents
{
  operation: "list",
  path: "./src",
  recursive: true,
  pattern: "*.ts"
}

// Check if file exists
{
  operation: "exists",
  path: "./package.json"
}

// Get file stats
{
  operation: "stat",
  path: "./README.md"
}

// Delete a file
{
  operation: "delete",
  path: "./temp.txt",
  recursive: false
}
```

## Security Considerations

### ⚠️ Important Warnings

**Code Execution**
- Code execution runs with the same permissions as the Node.js process
- Never expose this server to untrusted networks
- Always review code before execution
- Set appropriate `SANDBOX_TIMEOUT_MS` to prevent runaway processes

**File Operations**
- File operations are restricted to paths specified in `ALLOWED_PATHS`
- The server validates all paths against allowed directories
- Be cautious when allowing write operations to sensitive directories
- Default allowed paths: `.` (current directory) and `/tmp`

**Rate Limiting**
- Rate limiting is enabled by default (100 requests per minute)
- Adjust `RATE_LIMIT_REQUESTS` and `RATE_LIMIT_WINDOW_MS` as needed
- Consider setting stricter limits in production environments

**Network Requests**
- All external network requests have configurable timeouts
- The server retries failed requests up to `FETCH_RETRIES` times
- Review URLs before fetching to avoid malicious content

## Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run dev` | Run in development mode with hot reload |
| `npm run start` | Start the production server |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |

### Development Mode

For active development with auto-reload:

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Made with TypeScript and the [Model Context Protocol SDK](https://github.com/modelcontextprotocol)
