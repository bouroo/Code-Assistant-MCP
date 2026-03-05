import 'dotenv/config';
import { ConfigSchema, type Config } from './schema.js';
import { logger } from '../utils/logger.js';

export function loadConfig(): Config {
  const rawConfig = {
    github: {
      token: process.env.GITHUB_TOKEN
    },
    
    logging: {
      level: (process.env.LOG_LEVEL ?? 'info') as 'debug' | 'info' | 'warn' | 'error'
    },
    
    rateLimit: {
      requests: parseInt(process.env.RATE_LIMIT_REQUESTS ?? '100', 10),
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10)
    },
    
    fetcher: {
      timeoutMs: parseInt(process.env.FETCH_TIMEOUT_MS ?? '30000', 10),
      retries: parseInt(process.env.FETCH_RETRIES ?? '3', 10)
    },
    
    sandbox: {
      enabled: process.env.SANDBOX_ENABLED !== 'false',
      timeoutMs: parseInt(process.env.SANDBOX_TIMEOUT_MS ?? '10000', 10)
    },
    
    fileOperations: {
      allowedPaths: (process.env.ALLOWED_PATHS ?? '.').split(',').map(p => p.trim())
    }
  };
  
  const result = ConfigSchema.safeParse(rawConfig);
  
  if (!result.success) {
    logger.error('Configuration validation failed', result.error.issues);
    throw new Error('Invalid configuration');
  }
  
  return result.data;
}
