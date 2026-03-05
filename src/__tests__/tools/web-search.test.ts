import { describe, it, expect, vi, beforeEach } from 'vitest';
import { webSearchHandler } from '../../tools/web-search/handler.js';
import type { WebSearchInput } from '../../tools/web-search/types.js';

// Mock the ddg service
vi.mock('../../services/ddg.js', () => ({
  duckDuckGoService: {
    search: vi.fn(),
  },
}));

// Mock config
vi.mock('../../config/index.js', () => ({
  loadConfig: vi.fn(() => ({
    logging: { level: 'error' },
    rateLimit: { requests: 100, windowMs: 60000 },
    fetcher: { timeoutMs: 5000, retries: 3 },
  })),
}));

import { duckDuckGoService } from '../../services/ddg.js';

const mockSearch = duckDuckGoService.search as ReturnType<typeof vi.fn>;

describe('WebSearch Tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('webSearchHandler', () => {
    it('should return search results successfully', async () => {
      const mockResults = {
        results: [
          {
            title: 'Test Result',
            link: 'https://example.com',
            snippet: 'Test description',
          },
        ],
        totalResults: 1,
      };
      
      mockSearch.mockResolvedValue(mockResults);
      
      const input: WebSearchInput = {
        query: 'test query',
      };
      
      const result = await webSearchHandler(input);
      
      expect(result.results).toEqual(mockResults.results);
      expect(result.totalResults).toBe(1);
      expect(mockSearch).toHaveBeenCalledWith('test query', expect.objectContaining({
        maxResults: 10,
        safeSearch: 'moderate',
      }));
    });

    it('should pass safeSearch parameter to search service', async () => {
      mockSearch.mockResolvedValue({ results: [], totalResults: 0 });
      
      const input: WebSearchInput = {
        query: 'test query',
        safeSearch: 'strict',
      };
      
      await webSearchHandler(input);
      
      expect(mockSearch).toHaveBeenCalledWith('test query', expect.objectContaining({
        safeSearch: 'strict',
      }));
    });

    it('should pass maxResults parameter to search service', async () => {
      mockSearch.mockResolvedValue({ results: [], totalResults: 0 });
      
      const input: WebSearchInput = {
        query: 'test query',
        maxResults: 20,
      };
      
      await webSearchHandler(input);
      
      expect(mockSearch).toHaveBeenCalledWith('test query', expect.objectContaining({
        maxResults: 20,
      }));
    });

    it('should handle search service errors', async () => {
      mockSearch.mockRejectedValue(new Error('Search failed'));
      
      const input: WebSearchInput = {
        query: 'test query',
      };
      
      await expect(webSearchHandler(input)).rejects.toThrow('Search failed');
    });

    it('should handle empty query gracefully', async () => {
      mockSearch.mockResolvedValue({ results: [], totalResults: 0 });
      
      const input: WebSearchInput = {
        query: '',
      };
      
      const result = await webSearchHandler(input);
      
      expect(mockSearch).toHaveBeenCalledWith('', expect.any(Object));
      expect(result.results).toEqual([]);
    });
  });
});
