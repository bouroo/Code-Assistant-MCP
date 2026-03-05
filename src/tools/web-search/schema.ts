import { z } from 'zod';

export const WebSearchInputSchema = z.object({
  query: z.string()
    .min(1)
    .max(500)
    .describe('The search query string'),
  
  maxResults: z.number()
    .int()
    .min(1)
    .max(50)
    .default(10)
    .optional()
    .describe('Maximum number of results to return'),
  
  region: z.enum(['us-en', 'uk-en', 'de-de', 'fr-fr', 'es-es', 'it-it', 'pt-pt', 'nl-nl', 'jp-jp', 'kr-jp'])
    .default('us-en')
    .optional()
    .describe('Region for localized results'),
  
  safeSearch: z.enum(['strict', 'moderate', 'off'])
    .default('moderate')
    .optional()
    .describe('Safe search level'),
  
  timeRange: z.enum(['day', 'week', 'month', 'year', 'all'])
    .default('all')
    .optional()
    .describe('Time range for results')
});

export const WebSearchResultSchema = z.object({
  title: z.string(),
  link: z.string().url(),
  snippet: z.string(),
  date: z.string().optional()
});

export const WebSearchOutputSchema = z.object({
  results: z.array(WebSearchResultSchema),
  totalResults: z.number(),
  query: z.string(),
  searchedAt: z.string().datetime()
});
