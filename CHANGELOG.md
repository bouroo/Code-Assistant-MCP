# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-03-05

### Added
- **Test Infrastructure**: Added Vitest test framework with comprehensive test suite
  - Unit tests for RateLimiter utility (7 tests)
  - Unit tests for Logger utility (13 tests)
  - Unit tests for error classes (15 tests)
  - Configuration loading tests (10 tests)
  - Web search tool handler tests (5 tests)
  - Total: 50 tests passing

- **ESLint Configuration**: Added `.eslintrc.json` for code quality enforcement
- **EditorConfig**: Added `.editorconfig` for consistent editor settings
- **Coverage Scripts**: Added `test:coverage` npm script

### Changed
- Updated `package.json` with new scripts and dev dependencies:
  - Added `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser`
  - Added `eslint` dependency
  - Added `test:coverage` script
  - Added `lint:fix` script
- Updated `tsconfig.json` to exclude test files from production build

### Fixed
- Improved test infrastructure with proper mocking patterns
- Fixed module resolution for ESM compatibility

## [1.0.0] - 2024 (Initial Release)

### Added
- Initial MCP server implementation with tools:
  - Web Search (DuckDuckGo)
  - Documentation Search
  - Web Reader
  - Code Execution (sandboxed)
  - File Operations
- Configuration management with Zod validation
- Rate limiting
- Error handling utilities
- Logging infrastructure
