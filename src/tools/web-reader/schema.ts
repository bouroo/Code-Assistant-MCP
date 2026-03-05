import { z } from "zod";

export const WebReaderInputSchema = z.object({
  url: z.string().url().describe("The URL of the webpage to fetch and read"),

  returnFormat: z
    .enum(["markdown", "text", "json"])
    .default("markdown")
    .optional()
    .describe("Output format for the content"),

  retainImages: z
    .boolean()
    .default(true)
    .optional()
    .describe("Whether to retain image references in output"),

  withLinksSummary: z
    .boolean()
    .default(false)
    .optional()
    .describe("Include summary of all links found"),

  withImagesSummary: z
    .boolean()
    .default(false)
    .optional()
    .describe("Include summary of all images found"),

  timeout: z
    .number()
    .int()
    .min(5)
    .max(120)
    .default(30)
    .optional()
    .describe("Request timeout in seconds"),

  noCache: z
    .boolean()
    .default(false)
    .optional()
    .describe("Disable caching for this request"),
});

export const LinkSummarySchema = z.object({
  text: z.string(),
  url: z.string(),
});

export const ImageSummarySchema = z.object({
  alt: z.string().optional(),
  src: z.string(),
});

export const WebReaderOutputSchema = z.object({
  url: z.string(),
  title: z.string().optional(),
  content: z.string(),
  format: z.enum(["markdown", "text", "json"]),
  metadata: z
    .object({
      description: z.string().optional(),
      author: z.string().optional(),
      publishDate: z.string().optional(),
      wordCount: z.number(),
    })
    .optional(),
  links: z.array(LinkSummarySchema).optional(),
  images: z.array(ImageSummarySchema).optional(),
  fetchedAt: z.string().datetime(),
});
