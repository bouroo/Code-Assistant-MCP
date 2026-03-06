import { z } from "zod";
import { Octokit } from "@octokit/rest";
import type { ToolDefinition } from "../types/tools";
import { ToolError, TimeoutError } from "../types/errors";

const inputSchema = z.object({
  query: z.string().min(1).max(500).describe("Search query string"),
  type: z
    .enum(["code", "repos", "files"])
    .default("code")
    .describe("Type of search: code, repos, or files"),
  repository: z
    .string()
    .optional()
    .describe(
      "Optional: specific repository to search in (format: owner/repo)",
    ),
  language: z
    .string()
    .optional()
    .describe("Optional: filter by programming language"),
  maxResults: z
    .number()
    .min(1)
    .max(100)
    .default(20)
    .describe("Maximum number of results to return"),
});

type Input = z.infer<typeof inputSchema>;

interface SearchResult {
  name: string;
  path: string;
  repository: string;
  content?: string;
  snippet?: string;
  language?: string | null;
  url: string;
}

async function searchGitHub(
  input: Input,
  octokit: Octokit,
  timeout: number,
): Promise<SearchResult[]> {
  const { query, type, repository, language, maxResults } = input;

  // Build search query
  let searchQuery = query;
  if (repository) {
    searchQuery += ` repo:${repository}`;
  }
  if (language) {
    searchQuery += ` language:${language}`;
  }

  try {
    let response;

    switch (type) {
      case "code":
        response = await octokit.rest.search.code({
          q: searchQuery,
          per_page: maxResults,
        });

        return response.data.items.map((item) => ({
          name: item.name,
          path: item.path,
          repository: item.repository.full_name,
          snippet: item.text_matches?.[0]?.fragment || "",
          language: item.language || undefined,
          url: item.html_url,
        }));

      case "repos":
        response = await octokit.rest.search.repos({
          q: searchQuery,
          per_page: maxResults,
        });

        return response.data.items.map((item) => ({
          name: item.name,
          path: "/",
          repository: item.full_name,
          snippet: item.description || "",
          language: item.language || undefined,
          url: item.html_url,
        }));

      case "files":
        // Search for markdown and documentation files
        const fileQuery = `${searchQuery} filename:README OR filename:readme OR filename:*.md OR filename:*.txt`;
        response = await octokit.rest.search.code({
          q: fileQuery,
          per_page: maxResults,
        });

        const results: SearchResult[] = [];

        for (const item of response.data.items.slice(0, maxResults)) {
          // Fetch file content
          try {
            const [owner, repo] = item.repository.full_name.split("/");
            if (!owner || !repo) {
              continue;
            }
            const fileResponse = await octokit.rest.repos.getContent({
              owner,
              repo,
              path: item.path,
            });

            if ("content" in fileResponse.data) {
              const content = Buffer.from(
                fileResponse.data.content,
                "base64",
              ).toString("utf-8");

              results.push({
                name: item.name,
                path: item.path,
                repository: item.repository.full_name,
                content,
                language: item.language ?? null,
                url: item.html_url,
              });
            }
          } catch (error) {
            // Skip if can't fetch content
            results.push({
              name: item.name,
              path: item.path,
              repository: item.repository.full_name,
              snippet: item.text_matches?.[0]?.fragment || "",
              language: item.language ?? null,
              url: item.html_url,
            });
          }
        }

        return results;

      default:
        throw new ToolError("doc-search", `Invalid search type: ${type}`);
    }
  } catch (error: any) {
    if (error.status === 403) {
      throw new ToolError(
        "doc-search",
        "GitHub API rate limit exceeded. Consider providing a GITHUB_TOKEN environment variable for higher rate limits.",
      );
    }

    if (error.status === 422) {
      throw new ToolError(
        "doc-search",
        "Invalid search query. Please check your query syntax.",
      );
    }

    throw new ToolError("doc-search", `GitHub search failed: ${error.message}`);
  }
}

export const docSearchTool: ToolDefinition<
  Input,
  { results: SearchResult[]; totalCount: number }
> = {
  name: "doc-search",
  description:
    "Search GitHub repositories for code, documentation, and README files. Supports searching across code, repositories, and documentation files with optional language and repository filters.",
  inputSchema,
  handler: async (input, context) => {
    const { config, logger } = context;

    // Initialize Octokit with optional authentication
    const octokit = new Octokit({
      auth: config.tools.docSearch.githubToken,
      request: {
        timeout: config.tools.docSearch.timeout,
      },
    });

    logger.debug(
      { query: input.query, type: input.type, repository: input.repository },
      "Executing GitHub search",
    );

    try {
      const results = await searchGitHub(
        input,
        octokit,
        config.tools.docSearch.timeout,
      );

      logger.info(
        { query: input.query, type: input.type, resultsFound: results.length },
        "GitHub search completed",
      );

      return {
        results,
        totalCount: results.length,
      };
    } catch (error: any) {
      logger.error(
        { query: input.query, type: input.type, error: error.message },
        "GitHub search failed",
      );
      throw error;
    }
  },
};
