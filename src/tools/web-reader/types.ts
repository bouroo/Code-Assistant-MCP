export interface WebReaderInput {
  url: string;
  returnFormat?: 'markdown' | 'text' | 'json';
  retainImages?: boolean;
  withLinksSummary?: boolean;
  withImagesSummary?: boolean;
  timeout?: number;
  noCache?: boolean;
}

export interface LinkSummary {
  text: string;
  url: string;
}

export interface ImageSummary {
  alt?: string;
  src: string;
}

export interface WebReaderOutput {
  url: string;
  title?: string;
  content: string;
  format: 'markdown' | 'text' | 'json';
  metadata?: {
    description?: string;
    author?: string;
    publishDate?: string;
    wordCount: number;
  };
  links?: LinkSummary[];
  images?: ImageSummary[];
  fetchedAt: string;
}
