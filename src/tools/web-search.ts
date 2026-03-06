import { z } from "zod";
import * as cheerio from "cheerio";
import type { ToolDefinition } from "../types/tools";
import { ToolError, TimeoutError } from "../types/errors";

const inputSchema = z.object({
  query: z.string().min(1).max(500).describe("Search query string"),
  maxResults: z
    .number()
    .min(1)
    .max(50)
    .default(10)
    .describe("Maximum number of results to return"),
});

type Input = z.infer<typeof inputSchema>;

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  relevanceScore: number;
}

function calculateRelevanceScore(
  result: { title: string; snippet: string },
  query: string,
): number {
  const queryLower = query.toLowerCase();
  const titleLower = result.title.toLowerCase();
  const snippetLower = result.snippet.toLowerCase();

  let score = 0;

  // Exact matches get highest score
  if (titleLower.includes(queryLower)) score += 50;
  if (snippetLower.includes(queryLower)) score += 30;

  // Word-by-word matching
  const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 2);
  queryWords.forEach((word) => {
    if (titleLower.includes(word)) score += 5;
    if (snippetLower.includes(word)) score += 2;
  });

  return score;
}

async function searchDuckDuckGo(
  query: string,
  maxResults: number,
  timeout: number,
): Promise<SearchResult[]> {
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MCPBot/1.0)",
        Accept: "text/html",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ToolError(
        "web-search",
        `Search failed: ${response.status} ${response.statusText}`,
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const results: SearchResult[] = [];

    $(".result").each((i, elem) => {
      if (results.length >= maxResults) return false;

      const $elem = $(elem);
      const titleElem = $elem.find(".result__a");
      const snippetElem = $elem.find(".result__snippet");

      const title = titleElem.text().trim();
      const url = titleElem.attr("href") || "";
      const snippet = snippetElem.text().trim();

      if (title && url) {
        const relevanceScore = calculateRelevanceScore(
          { title, snippet },
          query,
        );

        results.push({
          title,
          url,
          snippet,
          relevanceScore,
        });
      }
    });

    // Sort by relevance score (descending)
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return results;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error instanceof ToolError) {
      throw error;
    }

    if (error.name === "AbortError") {
      throw new TimeoutError("web-search", timeout);
    }

    throw new ToolError("web-search", `Search failed: ${error.message}`);
  }
}

export const webSearchTool: ToolDefinition<
  Input,
  { results: SearchResult[]; totalCount: number; searchTime: number }
> = {
  name: "web-search",
  description:
    "Search the web using DuckDuckGo for documentation, tutorials, API references, and technical information. Returns ranked results with relevance scores.",
  inputSchema,
  handler: async (input, context) => {
    const { config, logger } = context;
    const timeout = config.tools.webSearch.timeout;

    logger.debug(
      { query: input.query, maxResults: input.maxResults },
      "Executing web search",
    );

    const startTime = Date.now();

    try {
      const results = await searchDuckDuckGo(
        input.query,
        input.maxResults,
        timeout,
      );

      const searchTime = Date.now() - startTime;

      logger.info(
        { query: input.query, resultsFound: results.length, searchTime },
        "Web search completed",
      );

      return {
        results,
        totalCount: results.length,
        searchTime,
      };
    } catch (error: any) {
      logger.error(
        { query: input.query, error: error.message },
        "Web search failed",
      );
      throw error;
    }
  },
};
