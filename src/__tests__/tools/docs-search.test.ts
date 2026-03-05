import { describe, it, expect, vi, beforeEach } from "vitest";
import { docsSearchHandler } from "../../tools/docs-search/handler.js";
import type { DocsSearchInput } from "../../tools/docs-search/types.js";

// Mock the github service
vi.mock("../../services/github.js", () => ({
  githubService: {
    searchCode: vi.fn(),
    searchIssues: vi.fn(),
    getReadme: vi.fn(),
  },
}));

// Mock config
vi.mock("../../config/index.js", () => ({
  loadConfig: vi.fn(() => ({
    logging: { level: "error" },
    rateLimit: { requests: 100, windowMs: 60000 },
    fetcher: { timeoutMs: 5000, retries: 3 },
  })),
}));

import { githubService } from "../../services/github.js";

const mockSearchCode = githubService.searchCode as ReturnType<typeof vi.fn>;
const mockSearchIssues = githubService.searchIssues as ReturnType<typeof vi.fn>;
const mockGetReadme = githubService.getReadme as ReturnType<typeof vi.fn>;

describe("DocsSearch Tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("docsSearchHandler", () => {
    it("should search code by default", async () => {
      const mockResults = [
        {
          file: "src/index.ts",
          line: 1,
          content: "test code",
          highlights: ["test"],
        },
      ];

      mockSearchCode.mockResolvedValue(mockResults);

      const input: DocsSearchInput = {
        repoName: "owner/repo",
        query: "test query",
      };

      const result = await docsSearchHandler(input);

      expect(mockSearchCode).toHaveBeenCalledWith(
        "owner/repo",
        "test query",
        undefined,
      );
      expect(result.type).toBe("search_results");
      expect(result.results).toEqual(mockResults);
      expect(result.totalResults).toBe(1);
    });

    it("should search code with language filter", async () => {
      mockSearchCode.mockResolvedValue([]);

      const input: DocsSearchInput = {
        repoName: "owner/repo",
        query: "test query",
        language: "en",
      };

      await docsSearchHandler(input);

      expect(mockSearchCode).toHaveBeenCalledWith(
        "owner/repo",
        "test query",
        "en",
      );
    });

    it("should search issues when searchType is issues", async () => {
      const mockIssues = [
        { number: 1, title: "Bug Report", body: "Issue body", state: "open" },
      ];

      mockSearchIssues.mockResolvedValue(mockIssues);

      const input: DocsSearchInput = {
        repoName: "owner/repo",
        query: "bug",
        searchType: "issues",
      };

      const result = await docsSearchHandler(input);

      expect(mockSearchIssues).toHaveBeenCalledWith("owner/repo", "bug");
      expect(result.type).toBe("search_results");
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        file: "#1",
        content: "Bug Report\nIssue body",
        highlights: ["open"],
      });
    });

    it("should get readme when searchType is readme", async () => {
      const mockReadme = { path: "README.md", content: "# Test", size: 100 };

      mockGetReadme.mockResolvedValue(mockReadme);

      const input: DocsSearchInput = {
        repoName: "owner/repo",
        query: "readme",
        searchType: "readme",
      };

      const result = await docsSearchHandler(input);

      expect(mockGetReadme).toHaveBeenCalledWith("owner/repo");
      expect(result.type).toBe("file_content");
      expect(result.file).toEqual(mockReadme);
    });

    it("should return empty results for discussions", async () => {
      const input: DocsSearchInput = {
        repoName: "owner/repo",
        query: "discussion",
        searchType: "discussions",
      };

      const result = await docsSearchHandler(input);

      expect(result.type).toBe("search_results");
      expect(result.results).toEqual([]);
      expect(result.totalResults).toBe(0);
    });

    it("should throw error for unknown search type", async () => {
      const input: DocsSearchInput = {
        repoName: "owner/repo",
        query: "test",
        searchType: "unknown" as any,
      };

      await expect(docsSearchHandler(input)).rejects.toThrow(
        "Unknown search type: unknown",
      );
    });

    it("should handle search service errors", async () => {
      mockSearchCode.mockRejectedValue(new Error("API rate limit exceeded"));

      const input: DocsSearchInput = {
        repoName: "owner/repo",
        query: "test",
      };

      await expect(docsSearchHandler(input)).rejects.toThrow(
        "API rate limit exceeded",
      );
    });

    it("should validate repoName format", async () => {
      const input: DocsSearchInput = {
        repoName: "invalid-repo-name",
        query: "test",
      };

      // Zod validation should reject invalid format
      await expect(docsSearchHandler(input)).rejects.toThrow();
    });
  });
});
