import { Octokit } from "@octokit/rest";
import { RateLimiter } from "../utils/rateLimiter.js";
import { logger } from "../utils/logger.js";
import { NotFoundError } from "../utils/errors.js";

export interface GitHubConfig {
  token?: string;
}

export interface SearchResult {
  file: string;
  line?: number;
  content: string;
  highlights?: string[];
}

export interface FileContent {
  path: string;
  content: string;
  language?: string;
  size: number;
}

export interface RepoStructureItem {
  path: string;
  type: "file" | "dir";
  name: string;
}

export class GitHubService {
  private octokit: Octokit;
  private rateLimiter: RateLimiter;

  constructor(config: GitHubConfig = {}) {
    this.octokit = new Octokit({
      auth: config.token,
      userAgent: "coder-agent-mcp/1.0.0",
    });

    // GitHub API rate limiting - 5000 requests per hour for authenticated
    // 60 requests per hour for unauthenticated
    const limit = config.token ? 5000 : 60;
    this.rateLimiter = new RateLimiter(limit, 3600000);
  }

  async searchCode(
    repoName: string,
    query: string,
    language?: string,
  ): Promise<SearchResult[]> {
    await this.rateLimiter.waitForSlot();

    const q = `${query} repo:${repoName}${language ? ` language:${language}` : ""}`;

    logger.debug("GitHub code search", { repoName, query, language });

    const response = await this.octokit.rest.search.code({
      q,
      per_page: 30,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return response.data.items.map((item: any) => ({
      file: item.path,
      line: item.line_numbers?.[0],
      content: item.text_matches?.[0]?.fragment ?? "",
      highlights:
        item.text_matches?.[0]?.matches?.map((m: any) => m.fragment) ?? [],
    }));
  }

  async getFileContent(
    repoName: string,
    filePath: string,
  ): Promise<FileContent> {
    await this.rateLimiter.waitForSlot();

    const [owner, repo] = repoName.split("/");

    logger.debug("GitHub get file content", { repoName, filePath });

    const response = await this.octokit.rest.repos.getContent({
      owner,
      repo,
      path: filePath,
    });

    if ("content" in response.data && response.data.content) {
      const content = Buffer.from(response.data.content, "base64").toString(
        "utf-8",
      );
      return {
        path: filePath,
        content,
        language: this.detectLanguage(filePath),
        size: response.data.size,
      };
    }

    throw new NotFoundError(`File not found: ${filePath}`);
  }

  async getDirectoryStructure(
    repoName: string,
    dirPath: string = "/",
  ): Promise<RepoStructureItem[]> {
    await this.rateLimiter.waitForSlot();

    const [owner, repo] = repoName.split("/");
    const path = dirPath === "/" ? "" : dirPath;

    logger.debug("GitHub get directory structure", { repoName, dirPath });

    const response = await this.octokit.rest.repos.getContent({
      owner,
      repo,
      path,
    });

    if (Array.isArray(response.data)) {
      return response.data.map((item) => ({
        path: item.path,
        type: item.type as "file" | "dir",
        name: item.name,
      }));
    }

    throw new NotFoundError(`Directory not found: ${dirPath}`);
  }

  async searchIssues(
    repoName: string,
    query: string,
  ): Promise<
    {
      title: string;
      body: string;
      number: number;
      state: string;
    }[]
  > {
    await this.rateLimiter.waitForSlot();

    const q = `${query} repo:${repoName}`;

    logger.debug("GitHub search issues", { repoName, query });

    const response = await this.octokit.rest.search.issuesAndPullRequests({
      q,
      per_page: 30,
    });

    return response.data.items.map((item) => ({
      title: item.title,
      body: item.body ?? "",
      number: item.number,
      state: item.state,
    }));
  }

  async getReadme(repoName: string): Promise<FileContent> {
    await this.rateLimiter.waitForSlot();

    const [owner, repo] = repoName.split("/");

    logger.debug("GitHub get README", { repoName });

    const response = await this.octokit.rest.repos.getReadme({
      owner,
      repo,
    });

    const content = Buffer.from(response.data.content, "base64").toString(
      "utf-8",
    );

    return {
      path: "README.md",
      content,
      language: "markdown",
      size: response.data.size,
    };
  }

  private detectLanguage(filePath: string): string | undefined {
    const ext = filePath.split(".").pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      ts: "typescript",
      tsx: "typescript",
      js: "javascript",
      jsx: "javascript",
      py: "python",
      rb: "ruby",
      go: "go",
      rs: "rust",
      java: "java",
      kt: "kotlin",
      md: "markdown",
      json: "json",
      yaml: "yaml",
      yml: "yaml",
      sql: "sql",
    };
    return ext ? languageMap[ext] : undefined;
  }
}

export const githubService = new GitHubService({
  token: process.env.GITHUB_TOKEN,
});
