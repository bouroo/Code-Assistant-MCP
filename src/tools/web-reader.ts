import { z } from "zod";
import TurndownService from "turndown";
import * as cheerio from "cheerio";
import type { ToolDefinition } from "../types/tools";
import { ToolError, TimeoutError } from "../types/errors.js";

const inputSchema = z.object({
  url: z.string().url().describe("URL to fetch and parse"),
  format: z
    .enum(["markdown", "text"])
    .default("markdown")
    .describe("Output format: markdown or plain text"),
  timeout: z
    .number()
    .min(1000)
    .max(60000)
    .optional()
    .describe("Request timeout in milliseconds"),
  maxWidth: z
    .number()
    .min(40)
    .max(120)
    .default(80)
    .describe("Maximum line width for text format"),
});

type Input = z.infer<typeof inputSchema>;

interface FetchResult {
  content: string;
  title?: string;
  url: string;
  fetchTime: number;
  contentType?: string;
}

function createTurndownService(): TurndownService {
  const service = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "*",
    strongDelimiter: "**",
  });

  // Preserve code blocks with language
  service.addRule("codeBlock", {
    filter: (node: any) => {
      return node.nodeName === "PRE" && node.querySelector("code") !== null;
    },
    replacement: (content: string, node: any) => {
      const codeNode = node.querySelector("code");
      const language =
        codeNode?.className
          ?.split(" ")
          ?.find((c: string) => c.startsWith("language-"))
          ?.replace("language-", "") || "";

      const code = codeNode?.textContent || content;
      return `\n\`\`\`${language}\n${code}\n\`\`\`\n`;
    },
  });

  // Preserve inline code
  service.addRule("inlineCode", {
    filter: (node) => node.nodeName === "CODE",
    replacement: (content) => `\`${content}\``,
  });

  // Handle links
  service.addRule("link", {
    filter: "a",
    replacement: (content, node: any) => {
      const href = node.getAttribute("href");
      return href ? `[${content}](${href})` : content;
    },
  });

  return service;
}

function wrapText(text: string, maxWidth: number): string {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (currentLine.length + word.length + 1 > maxWidth) {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    } else {
      currentLine += (currentLine ? " " : "") + word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.join("\n");
}

async function fetchAndParse(
  url: string,
  format: "markdown" | "text",
  maxWidth: number,
  timeout: number,
  maxSize: number,
): Promise<FetchResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MCPBot/1.0)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ToolError(
        "web-reader",
        `Failed to fetch URL: ${response.status} ${response.statusText}`,
      );
    }

    // Check content length
    const contentLength = parseInt(
      response.headers.get("content-length") || "0",
    );
    if (contentLength > maxSize) {
      throw new ToolError(
        "web-reader",
        `Content too large: ${contentLength} bytes (max: ${maxSize})`,
      );
    }

    const html = await response.text();

    // Check if content is too large after fetching
    if (html.length > maxSize) {
      throw new ToolError(
        "web-reader",
        `Content too large: ${html.length} bytes (max: ${maxSize})`,
      );
    }

    // Parse HTML
    const $ = cheerio.load(html);

    // Extract title
    const title = $("title").text().trim() || $("h1").first().text().trim();

    // Extract main content - try common content selectors
    const contentSelectors = [
      "main",
      "article",
      ".content",
      "#content",
      ".post",
      ".article",
      '[role="main"]',
      ".documentation",
      ".docs",
    ];

    let contentToConvert: any = $("body");

    for (const selector of contentSelectors) {
      const elem = $(selector).first();
      if (elem.length > 0 && elem.text().trim().length > 100) {
        contentToConvert = elem;
        break;
      }
    }

    // Remove unwanted elements
    contentToConvert
      .find(
        "script, style, nav, header, footer, aside, .ads, .advertisement, .cookie-banner",
      )
      .remove();

    let content: string;

    if (format === "markdown") {
      const turndownService = createTurndownService();
      content = turndownService.turndown(contentToConvert.html() || "");
    } else {
      // Plain text
      content = contentToConvert.text().replace(/\s+/g, " ").trim();

      // Wrap text at max width
      content = wrapText(content, maxWidth);
    }

    const fetchTime = Date.now() - startTime;

    return {
      content,
      title,
      url,
      fetchTime,
      contentType: response.headers.get("content-type") || undefined,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error instanceof ToolError) {
      throw error;
    }

    if (error.name === "AbortError") {
      throw new TimeoutError("web-reader", timeout);
    }

    throw new ToolError("web-reader", `Failed to fetch URL: ${error.message}`);
  }
}

export const webReaderTool: ToolDefinition<Input, FetchResult> = {
  name: "web-reader",
  description:
    "Fetch and parse webpages into clean markdown or plain text format. Preserves code blocks, headings, lists, and formatting essential for technical documentation.",
  inputSchema,
  handler: async (input, context) => {
    const { config, logger } = context;
    const timeout = input.timeout || config.tools.webReader.timeout;

    logger.debug({ url: input.url, format: input.format }, "Fetching webpage");

    try {
      const result = await fetchAndParse(
        input.url,
        input.format,
        input.maxWidth,
        timeout,
        config.tools.webReader.maxSize,
      );

      logger.info(
        { url: input.url, title: result.title, fetchTime: result.fetchTime },
        "Webpage fetched successfully",
      );

      return result;
    } catch (error: any) {
      logger.error(
        { url: input.url, error: error.message },
        "Failed to fetch webpage",
      );
      throw error;
    }
  },
};
