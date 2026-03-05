import { fetcherService } from "../../services/fetcher.js";
import {
  parseHtml,
  htmlToMarkdown,
  htmlToText,
} from "../../utils/htmlParser.js";
import { logger } from "../../utils/logger.js";
import type { WebReaderInput, WebReaderOutput, LinkSummary } from "./types.js";

export async function webReaderHandler(
  input: WebReaderInput,
): Promise<WebReaderOutput> {
  logger.info("Web reader request", { url: input.url });

  const format = input.returnFormat ?? "markdown";
  const timeoutMs = (input.timeout ?? 30) * 1000;

  const response = await fetcherService.fetch(input.url, {
    timeout: timeoutMs,
    retries: input.noCache ? 1 : 3,
  });

  if (response.status !== 200) {
    throw new Error(`Failed to fetch URL: ${response.status}`);
  }

  const parsed = parseHtml(response.content, response.url);
  const formatFn =
    format === "markdown"
      ? htmlToMarkdown
      : format === "text"
        ? htmlToText
        : () => response.content;
  const content = formatFn(response.content, response.url);

  const result: WebReaderOutput = {
    url: input.url,
    title: parsed.title,
    content,
    format,
    metadata: {
      description: parsed.metadata.description,
      author: parsed.metadata.author,
      publishDate: parsed.metadata.publishDate,
      wordCount: parsed.text.split(/\s+/).length,
    },
    fetchedAt: new Date().toISOString(),
  };

  if (input.withLinksSummary) {
    result.links = parsed.links.map((l) => ({
      text: l.text,
      url: l.href,
    })) as LinkSummary[];
  }

  if (input.withImagesSummary && input.retainImages !== false) {
    result.images = parsed.images;
  }

  return result;
}
