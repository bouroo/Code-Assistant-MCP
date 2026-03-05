export interface WebSearchInput {
  query: string;
  maxResults?: number;
  region?: string;
  safeSearch?: "strict" | "moderate" | "off";
  timeRange?: "day" | "week" | "month" | "year" | "all";
}

export interface WebSearchResult {
  title: string;
  link: string;
  snippet: string;
  date?: string;
}

export interface WebSearchOutput {
  results: WebSearchResult[];
  totalResults: number;
  query: string;
  searchedAt: string;
}
