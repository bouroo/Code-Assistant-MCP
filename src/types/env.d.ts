declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // GitHub API token - optional but recommended for higher rate limits
      GITHUB_TOKEN?: string;
      
      // Log level: debug, info, warn, error
      LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
      
      // Rate limiting configuration
      RATE_LIMIT_REQUESTS?: string;
      RATE_LIMIT_WINDOW_MS?: string;
      
      // HTTP fetcher configuration
      FETCH_TIMEOUT_MS?: string;
      FETCH_RETRIES?: string;
      
      // Code execution sandbox
      SANDBOX_ENABLED?: string;
      SANDBOX_TIMEOUT_MS?: string;
      
      // File operations - allowed base paths
      ALLOWED_PATHS?: string;
    }
  }
}

export {};
