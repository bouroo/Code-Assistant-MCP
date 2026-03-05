export interface DocsSearchInput {
  repoName: string;
  query: string;
  searchType?: 'code' | 'issues' | 'discussions' | 'readme';
  language?: 'en' | 'zh' | 'ja' | 'ko' | 'es' | 'fr' | 'de';
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
  type: 'file' | 'dir';
  name: string;
}

export type DocsSearchOutput = 
  | { type: 'search_results'; results: SearchResult[]; totalResults: number }
  | { type: 'file_content'; file: FileContent }
  | { type: 'directory_structure'; structure: RepoStructureItem[]; path: string };
