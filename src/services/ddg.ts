import { search as ddgSearch } from "duck-duck-scrape";
import { RateLimiter } from "../utils/rateLimiter.js";
import { logger } from "../utils/logger.js";

export interface DuckDuckGoResult {
  title: string;
  link: string;
  snippet: string;
  date?: string;
}

export interface DuckDuckGoOptions {
  maxResults?: number;
  region?: string;
  safeSearch?: "strict" | "moderate" | "off";
  timeRange?: "day" | "week" | "month" | "year";
}

export class DuckDuckGoService {
  private rateLimiter: RateLimiter;

  constructor() {
    // DuckDuckGo rate limiting - 30 requests per minute
    this.rateLimiter = new RateLimiter(30, 60000);
  }

  async search(
    query: string,
    options: DuckDuckGoOptions = {},
  ): Promise<{
    results: DuckDuckGoResult[];
    totalResults: number;
  }> {
    await this.rateLimiter.waitForSlot();

    const searchOptions = {
      safeSearch: options.safeSearch ?? "moderate",
      region: options.region ?? "us-en",
    };

    logger.debug("DuckDuckGo search", { query, options });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = await ddgSearch(query, searchOptions as any);

    const limitedResults = (results.results as any[])
      .slice(0, options.maxResults ?? 10)
      .map((r: any) => ({
        title: r.title,
        link: r.url,
        snippet: r.snippet || "",
        date: r.date,
      }));

    return {
      results: limitedResults,
      totalResults: results.results.length,
    };
  }
}

export const duckDuckGoService = new DuckDuckGoService();
