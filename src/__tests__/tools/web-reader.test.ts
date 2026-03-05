import { describe, it, expect, vi, beforeEach } from "vitest";
import { webReaderHandler } from "../../tools/web-reader/handler.js";
import type { WebReaderInput } from "../../tools/web-reader/types.js";

// Mock the fetcher service
vi.mock("../../services/fetcher.js", () => ({
  fetcherService: {
    fetch: vi.fn(),
  },
}));

// Mock html parser
vi.mock("../../utils/htmlParser.js", () => ({
  parseHtml: vi.fn(),
  htmlToMarkdown: vi.fn((content: string) => "# Converted Markdown"),
  htmlToText: vi.fn((content: string) => "Converted Text"),
}));

// Mock config
vi.mock("../../config/index.js", () => ({
  loadConfig: vi.fn(() => ({
    logging: { level: "error" },
    rateLimit: { requests: 100, windowMs: 60000 },
    fetcher: { timeoutMs: 5000, retries: 3 },
  })),
}));

import { fetcherService } from "../../services/fetcher.js";
import {
  parseHtml,
  htmlToMarkdown,
  htmlToText,
} from "../../utils/htmlParser.js";

const mockFetch = fetcherService.fetch as ReturnType<typeof vi.fn>;
const mockParseHtml = parseHtml as ReturnType<typeof vi.fn>;
const mockHtmlToMarkdown = htmlToMarkdown as ReturnType<typeof vi.fn>;
const mockHtmlToText = htmlToText as ReturnType<typeof vi.fn>;

describe("WebReader Tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHtmlToMarkdown.mockImplementation(
      (content: string) => "# Converted Markdown",
    );
    mockHtmlToText.mockImplementation((content: string) => "Converted Text");
  });

  describe("webReaderHandler", () => {
    const mockParsedHtml = {
      title: "Test Page",
      metadata: {
        description: "Test description",
        author: "Test Author",
        publishDate: "2024-01-01",
      },
      text: "Test content with words in it",
      links: [
        { text: "Link 1", href: "https://example.com/1" },
        { text: "Link 2", href: "https://example.com/2" },
      ],
      images: [{ src: "https://example.com/img1.jpg", alt: "Image 1" }],
    };

    it("should fetch and convert URL to markdown by default", async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        content: "<html><body>Test</body></html>",
        url: "https://example.com",
      });
      mockParseHtml.mockReturnValue(mockParsedHtml);

      const input: WebReaderInput = {
        url: "https://example.com",
      };

      const result = await webReaderHandler(input);

      expect(mockFetch).toHaveBeenCalledWith("https://example.com", {
        timeout: 30000,
        retries: 3,
      });
      expect(result.url).toBe("https://example.com");
      expect(result.title).toBe("Test Page");
      expect(result.format).toBe("markdown");
      expect(result.metadata.wordCount).toBe(6);
    });

    it("should convert to text format", async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        content: "<html><body>Test</body></html>",
        url: "https://example.com",
      });
      mockParseHtml.mockReturnValue(mockParsedHtml);

      const input: WebReaderInput = {
        url: "https://example.com",
        returnFormat: "text",
      };

      const result = await webReaderHandler(input);

      expect(mockHtmlToText).toHaveBeenCalled();
      expect(result.format).toBe("text");
    });

    it("should return raw format", async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        content: "<html><body>Test</body></html>",
        url: "https://example.com",
      });
      mockParseHtml.mockReturnValue(mockParsedHtml);

      const input: WebReaderInput = {
        url: "https://example.com",
        returnFormat: "raw",
      };

      const result = await webReaderHandler(input);

      expect(result.format).toBe("raw");
    });

    it("should include links summary when requested", async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        content: "<html><body>Test</body></html>",
        url: "https://example.com",
      });
      mockParseHtml.mockReturnValue(mockParsedHtml);

      const input: WebReaderInput = {
        url: "https://example.com",
        withLinksSummary: true,
      };

      const result = await webReaderHandler(input);

      expect(result.links).toHaveLength(2);
      expect(result.links?.[0]).toEqual({
        text: "Link 1",
        url: "https://example.com/1",
      });
    });

    it("should include images summary when requested", async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        content: "<html><body>Test</body></html>",
        url: "https://example.com",
      });
      mockParseHtml.mockReturnValue(mockParsedHtml);

      const input: WebReaderInput = {
        url: "https://example.com",
        withImagesSummary: true,
      };

      const result = await webReaderHandler(input);

      expect(result.images).toHaveLength(1);
    });

    it("should handle custom timeout", async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        content: "<html><body>Test</body></html>",
        url: "https://example.com",
      });
      mockParseHtml.mockReturnValue(mockParsedHtml);

      const input: WebReaderInput = {
        url: "https://example.com",
        timeout: 60,
      };

      await webReaderHandler(input);

      expect(mockFetch).toHaveBeenCalledWith("https://example.com", {
        timeout: 60000,
        retries: 3,
      });
    });

    it("should use no cache when requested", async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        content: "<html><body>Test</body></html>",
        url: "https://example.com",
      });
      mockParseHtml.mockReturnValue(mockParsedHtml);

      const input: WebReaderInput = {
        url: "https://example.com",
        noCache: true,
      };

      await webReaderHandler(input);

      expect(mockFetch).toHaveBeenCalledWith("https://example.com", {
        timeout: 30000,
        retries: 1,
      });
    });

    it("should throw error when fetch fails", async () => {
      mockFetch.mockResolvedValue({
        status: 404,
        content: "",
        url: "https://example.com",
      });

      const input: WebReaderInput = {
        url: "https://example.com",
      };

      await expect(webReaderHandler(input)).rejects.toThrow(
        "Failed to fetch URL: 404",
      );
    });

    it("should handle fetch errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const input: WebReaderInput = {
        url: "https://example.com",
      };

      await expect(webReaderHandler(input)).rejects.toThrow("Network error");
    });
  });
});
