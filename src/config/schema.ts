import { z } from 'zod';

export const ConfigSchema = z.object({
  github: z.object({
    token: z.string().optional()
  }),
  
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info')
  }),
  
  rateLimit: z.object({
    requests: z.number().int().positive().default(100),
    windowMs: z.number().int().positive().default(60000)
  }),
  
  fetcher: z.object({
    timeoutMs: z.number().int().positive().default(30000),
    retries: z.number().int().nonnegative().default(3)
  }),
  
  sandbox: z.object({
    enabled: z.boolean().default(true),
    timeoutMs: z.number().int().positive().default(10000)
  }),
  
  fileOperations: z.object({
    allowedPaths: z.array(z.string()).default(['.'])
  })
});

export type Config = z.infer<typeof ConfigSchema>;
