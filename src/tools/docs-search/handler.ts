import { githubService } from '../../services/github.js';
import { logger } from '../../utils/logger.js';
import type { DocsSearchInput, DocsSearchOutput } from './types.js';

export async function docsSearchHandler(input: DocsSearchInput): Promise<DocsSearchOutput> {
  logger.info('Docs search request', { repoName: input.repoName, query: input.query, searchType: input.searchType });
  
  const searchType = input.searchType ?? 'code';
  
  switch (searchType) {
    case 'code': {
      const results = await githubService.searchCode(input.repoName, input.query, input.language);
      return {
        type: 'search_results',
        results,
        totalResults: results.length
      };
    }
    
    case 'issues': {
      const results = await githubService.searchIssues(input.repoName, input.query);
      return {
        type: 'search_results',
        results: results.map(r => ({
          file: `#${r.number}`,
          content: `${r.title}\n${r.body}`,
          highlights: [r.state]
        })),
        totalResults: results.length
      };
    }
    
    case 'readme': {
      const file = await githubService.getReadme(input.repoName);
      return {
        type: 'file_content',
        file
      };
    }
    
    case 'discussions': {
      // Discussions require GraphQL API, not available in @octokit/rest
      // Return empty results for now
      return {
        type: 'search_results',
        results: [],
        totalResults: 0
      };
    }
    
    default:
      throw new Error(`Unknown search type: ${searchType}`);
  }
}
