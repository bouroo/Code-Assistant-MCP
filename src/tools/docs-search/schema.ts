import { z } from "zod";

export const DocsSearchInputSchema = z.object({
  repoName: z
    .string()
    .regex(/^[\w-]+\/[\w.-]+$/, "Must be in format: owner/repo")
    .describe("GitHub repository name in format owner/repo"),

  query: z
    .string()
    .min(1)
    .max(1000)
    .describe("Search query for documentation, code, or comments"),

  searchType: z
    .enum(["code", "issues", "discussions", "readme"])
    .default("code")
    .optional()
    .describe("Type of content to search"),

  language: z
    .enum(["en", "zh", "ja", "ko", "es", "fr", "de"])
    .default("en")
    .optional()
    .describe("Language preference for results"),
});

export const FileContentSchema = z.object({
  path: z.string(),
  content: z.string(),
  language: z.string().optional(),
  size: z.number(),
});

export const RepoStructureSchema = z.object({
  path: z.string(),
  type: z.enum(["file", "dir"]),
  name: z.string(),
});

export const DocsSearchOutputSchema = z.union([
  z.object({
    type: z.literal("search_results"),
    results: z.array(
      z.object({
        file: z.string(),
        line: z.number().optional(),
        content: z.string(),
        highlights: z.array(z.string()).optional(),
      }),
    ),
    totalResults: z.number(),
  }),
  z.object({
    type: z.literal("file_content"),
    file: FileContentSchema,
  }),
  z.object({
    type: z.literal("directory_structure"),
    structure: z.array(RepoStructureSchema),
    path: z.string(),
  }),
]);
