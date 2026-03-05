import * as cheerio from "cheerio";

export interface ParsedContent {
  title?: string;
  text: string;
  links: Array<{ text: string; href: string }>;
  images: Array<{ alt?: string; src: string }>;
  metadata: {
    description?: string;
    author?: string;
    publishDate?: string;
  };
}

export function parseHtml(html: string, baseUrl: string): ParsedContent {
  const $ = cheerio.load(html);

  // Remove unwanted elements
  $("script, style, nav, footer, header, aside").remove();

  // Extract title
  const title =
    $("title").text().trim() ||
    $('meta[property="og:title"]').attr("content") ||
    undefined;

  // Extract metadata
  const metadata = {
    description:
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      undefined,
    author: $('meta[name="author"]').attr("content") || undefined,
    publishDate:
      $('meta[property="article:published_time"]').attr("content") ||
      $("time[datetime]").attr("datetime") ||
      undefined,
  };

  // Extract links
  const links: Array<{ text: string; href: string }> = [];
  $("a[href]").each((_, el) => {
    const $el = $(el);
    const href = $el.attr("href");
    const text = $el.text().trim();
    if (href && text) {
      try {
        const absoluteUrl = new URL(href, baseUrl).href;
        links.push({ text, href: absoluteUrl });
      } catch {
        // Skip invalid URLs
      }
    }
  });

  // Extract images
  const images: Array<{ alt?: string; src: string }> = [];
  $("img[src]").each((_, el) => {
    const $el = $(el);
    const src = $el.attr("src");
    if (src) {
      try {
        const absoluteUrl = new URL(src, baseUrl).href;
        images.push({
          alt: $el.attr("alt") || undefined,
          src: absoluteUrl,
        });
      } catch {
        // Skip invalid URLs
      }
    }
  });

  // Extract main content
  const mainContent = $(
    "main, article, .content, #content, .post, .article",
  ).first();
  const contentElement = mainContent.length ? mainContent : $("body");
  const text = contentElement.text().trim();

  return {
    title,
    text,
    links,
    images,
    metadata,
  };
}

export function htmlToMarkdown(html: string, baseUrl: string): string {
  const $ = cheerio.load(html);

  // Remove unwanted elements
  $("script, style, nav, footer").remove();

  // Convert elements to markdown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convertElement = (el: any): string => {
    const $el = $(el);

    if (el.type === "text") {
      return $el.text();
    }

    const tag = el.tagName?.toLowerCase();

    switch (tag) {
      case "h1":
        return `# ${$el.text()}\n\n`;
      case "h2":
        return `## ${$el.text()}\n\n`;
      case "h3":
        return `### ${$el.text()}\n\n`;
      case "h4":
        return `#### ${$el.text()}\n\n`;
      case "h5":
        return `##### ${$el.text()}\n\n`;
      case "h6":
        return `###### ${$el.text()}\n\n`;
      case "p":
        return `${$el.text()}\n\n`;
      case "br":
        return "\n";
      case "a": {
        const href = $el.attr("href");
        const text = $el.text();
        if (href) {
          try {
            const absoluteUrl = new URL(href, baseUrl).href;
            return `[${text}](${absoluteUrl})`;
          } catch {
            return text;
          }
        }
        return text;
      }
      case "img": {
        const src = $el.attr("src");
        const alt = $el.attr("alt") || "";
        if (src) {
          try {
            const absoluteUrl = new URL(src, baseUrl).href;
            return `![${alt}](${absoluteUrl})`;
          } catch {
            return "";
          }
        }
        return "";
      }
      case "code":
        return `\`${$el.text()}\``;
      case "pre":
        return `\`\`\`\n${$el.text()}\n\`\`\`\n\n`;
      case "blockquote":
        return (
          $el
            .text()
            .split("\n")
            .map((line) => `> ${line}`)
            .join("\n") + "\n\n"
        );
      case "ul":
      case "ol": {
        const items = $el.children("li").toArray();
        return (
          items
            .map((li, i) => {
              const prefix = tag === "ol" ? `${i + 1}. ` : "- ";
              return `${prefix}${$(li).text()}`;
            })
            .join("\n") + "\n\n"
        );
      }
      case "hr":
        return "---\n\n";
      case "strong":
      case "b":
        return `**${$el.text()}**`;
      case "em":
      case "i":
        return `*${$el.text()}*`;
      default:
        return $el.text();
    }
  };

  // Process body content
  const body = $("body");
  let markdown = "";

  body.contents().each((_, el) => {
    markdown += convertElement(el);
  });

  return markdown.trim();
}

export function htmlToText(html: string, baseUrl: string): string {
  const parsed = parseHtml(html, baseUrl);
  return parsed.text;
}
