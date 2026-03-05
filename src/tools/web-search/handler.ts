import { duckDuckGoService } from '../../services/ddg.js';
import { logger } from '../../utils/logger.js';
import type { WebSearchInput, WebSearchOutput } from './types.js';

export async function webSearchHandler(input: WebSearchInput): Promise<WebSearchOutput> {
  logger.info('Web search request', { query: input.query });
  
  const options = {
    maxResults: input.maxResults ?? 10,
    region: input.region ?? 'us-en',
    safeSearch: input.safeSearch ?? 'moderate',
    timeRange: input.timeRange !== 'all' ? input.timeRange : undefined
  };
  
  const searchResults = await duckDuckGoService.search(input.query, options);
  
  return {
    results: searchResults.results,
    totalResults: searchResults.totalResults,
    query: input.query,
    searchedAt: new Date().toISOString()
  };
}
