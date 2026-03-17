export interface KeywordInfo {
  word: string;
  count: number;
}

export interface KeywordPlacement {
  primary: string;
  inTitle: boolean;
  inH1: boolean;
  inMetaDescription: boolean;
  inFirst100Words: boolean;
  density: number;
  densityStatus: 'low' | 'optimal' | 'high';
  totalWords: number;
  keywordCount: number;
}

export interface KeywordsAnalysis {
  keywords: KeywordInfo[];
  placement: KeywordPlacement | null;
  issues: Issue[];
}

export interface BrokenLink {
  href: string;
  status: number;
  error?: string;
}

export interface EEATSignals {
  hasAuthor: boolean;
  authorName: string | null;
  hasPublishedDate: boolean;
  publishedDate: string | null;
  hasModifiedDate: boolean;
  modifiedDate: string | null;
  hasContactLink: boolean;
  hasPrivacyPolicy: boolean;
  hasTermsOfService: boolean;
  signalCount: number;
}

export interface AccessibilityBasics {
  missingFormLabels: number;
  missingButtonLabels: number;
  hasSkipNav: boolean;
  hasLangAttribute: boolean;
}

export interface AnalysisResult {
  url: string;
  timestamp: string;
  score: number;
  keywords: KeywordsAnalysis;
  headings: HeadingsAnalysis;
  images: ImagesAnalysis;
  links: LinksAnalysis;
  technical: TechnicalAnalysis;
  metadata: MetadataAnalysis;
  readability: ReadabilityAnalysis;
}

export interface HeadingsAnalysis {
  score: number;
  title: { content: string; length: number; isOptimal: boolean };
  metaDescription: { content: string; length: number; isOptimal: boolean };
  h1: string[];
  h2: string[];
  h3: string[];
  h4: string[];
  h5: string[];
  h6: string[];
  issues: Issue[];
}

export interface ImagesAnalysis {
  score: number;
  total: number;
  withAlt: number;
  withoutAlt: number;
  withoutResponsive: number;
  images: ImageInfo[];
  issues: Issue[];
}

export interface ImageInfo {
  src: string;
  alt: string;
  hasAlt: boolean;
  width?: string;
  height?: string;
  isLazy: boolean;
  format: string;
  hasSrcset: boolean;
}

export interface LinksAnalysis {
  score: number;
  total: number;
  internal: LinkInfo[];
  external: LinkInfo[];
  nofollow: number;
  dofollow: number;
  emptyAnchors: number;
  genericAnchors: number;
  withImages: number;
  uniqueAnchors: number;
  brokenLinks: BrokenLink[];
  internalBrokenLinks: BrokenLink[];
  issues: Issue[];
}

export interface LinkInfo {
  href: string;
  text: string;
  isNofollow: boolean;
  isSponsored: boolean;
  isUgc: boolean;
  isExternal: boolean;
}

export interface CwvMetrics {
  performance: number;
  fcp: number;
  lcp: number;
  cls: number;
  tbt: number;
  si: number;
}

export interface TechnicalAnalysis {
  score: number;
  robotsTxt: { exists: boolean; content?: string };
  sitemap: { exists: boolean; url?: string; inRobots?: boolean };
  llmsTxt: { exists: boolean; content?: string };
  canonical: string | null;
  lang: string | null;
  viewport: string | null;
  charset: string | null;
  cms: string | null;
  technologies: string[];
  htmlSize: number;
  isHttps: boolean;
  mixedContentCount: number;
  accessibility: AccessibilityBasics;
  cssAnalysis: {
    total: number;
    inline: number;
    local: number;
    external: number;
  };
  jsAnalysis: {
    total: number;
    inline: number;
    local: number;
    external: number;
    blocking: number;
  };
  coreWebVitals?: {
    mobile: CwvMetrics | null;
    desktop: CwvMetrics | null;
  };
  urlStructure: {
    length: number;
    hasUnderscores: boolean;
    hasUppercase: boolean;
    hasSpecialChars: boolean;
    depth: number;
    keywordInUrl: boolean;
  };
  resourceHints: {
    preconnect: number;
    preload: number;
    prefetch: number;
    dnsPrefetch: number;
  };
  httpHeaders: {
    xRobotsTag: string | null;
    cacheControl: string | null;
    contentSecurityPolicy: boolean;
    strictTransportSecurity: boolean;
  };
  manifest: { exists: boolean; href?: string };
  issues: Issue[];
}

export interface MetadataAnalysis {
  score: number;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogUrl: string | null;
  ogType: string | null;
  twitterCard: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  favicon: string | null;
  robots: string | null;
  hreflang: { lang: string; href: string }[];
  structuredData: { exists: boolean; types: string[] };
  eeat: EEATSignals;
  duplicates: {
    titleCount: number;
    descriptionCount: number;
    titleMatchesOg: boolean;
  };
  issues: Issue[];
}

export interface SentenceInfo {
  text: string;
  wordCount: number;
  charCount: number;
}

export interface SentenceDistribution {
  veryShort: number;  // 1-5 words
  short: number;      // 6-10 words
  medium: number;     // 11-20 words
  long: number;       // 21-30 words
  veryLong: number;   // 31+ words
}

export interface ReadabilityAnalysis {
  score: number;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgWordsPerSentence: number;
  readingTime: number;
  fleschScore: number;
  fleschLevel: string;
  distribution: SentenceDistribution;
  longestSentences: SentenceInfo[];
  tips: string[];
  issues: Issue[];
}

export interface Issue {
  type: 'error' | 'warning' | 'info';
  message: string;
}
