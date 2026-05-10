/**
 * Types for the GEO/AI analysis stack.
 *
 * `GeoAnalysisResult` matches the JSON returned by `POST /api/geo-analyze`.
 * It's the secondary, async-fetched payload that decorates the primary
 * `AnalysisResult` (from `src/lib/types.ts`) on the report page.
 *
 * The shape is fixed by `src/app/api/geo-analyze/route.ts` (the only producer)
 * and consumed by `lib/types.ts` (`AnalysisResult.geoAnalysis`) and
 * `components/report/ReportView.tsx` (scorecards + plan + GEO panels).
 */

export type GeoCategory = 'Excellent' | 'Bon' | 'Moyen' | 'Faible' | 'Critique';

export interface LighthouseScores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  /** True when no GOOGLE_PAGESPEED_API_KEY is configured — scores are heuristic, not real. */
  isEstimated?: boolean;
  warning?: string;
}

export interface SeoBreakdown {
  lighthouse: number;
  technicalSEO: number;
  content: number;
}

export interface GeoSeoBlock {
  score: number;
  breakdown: SeoBreakdown;
  lighthouse: LighthouseScores;
}

export interface GeoIndexationEngineResult {
  indexed: boolean;
  confidence: string;
  mentions: number;
  name?: string;
  company?: string;
  /**
   * Raw error message when the upstream LLM API failed (404, 401, timeout…).
   * Surfaced to the UI so a deprecated model or revoked key shows up as
   * "moteur indisponible" instead of silently looking like indexed=false.
   */
  error?: string;
}

export interface GeoIndexation {
  score: number;
  totalIndexed: number;
  totalEnabled: number;
  region?: string;
  engines: Record<string, GeoIndexationEngineResult>;
}

export interface SchemaSignals {
  organization: boolean;
  author: boolean;
  faqPage: boolean;
  breadcrumb: boolean;
  article: boolean;
  website: boolean;
}

export interface GeoSchema {
  score: number;
  totalFound: number;
  schemas: SchemaSignals;
}

export interface EeatSignals {
  teamPage: { found: boolean };
  legalMentions: boolean;
  contactPage: { found: boolean };
  testimonials: { found: boolean; count: number };
}

export interface GeoEeat {
  score: number;
  signals: EeatSignals;
}

export interface GeoBreakdown {
  indexation: number;
  schema: number;
  eeat: number;
}

export interface GeoBlock {
  score: number;
  breakdown: GeoBreakdown;
  indexation: GeoIndexation;
  schema: GeoSchema;
  eeat: GeoEeat;
}

export type GeoRecommendationPriority = 'critical' | 'high' | 'medium' | 'low';
export type GeoRecommendationDifficulty = 'low' | 'medium' | 'high';
export type GeoRecommendationCategory = 'seo' | 'geo';

export interface GeoRecommendation {
  priority: GeoRecommendationPriority;
  title: string;
  description: string;
  impact: number;
  difficulty: GeoRecommendationDifficulty;
  category: GeoRecommendationCategory;
  timeframe: string;
}

export interface GeoProjectionWindow {
  estimatedScore: number;
  gain: number;
  quickWins: string[];
  requiredActions: string[];
}

export interface GeoProjection {
  threeMonths: GeoProjectionWindow;
  sixMonths: GeoProjectionWindow;
}

/**
 * Per-analyzer health flags surfaced in the API response when one or
 * more sub-analyzers failed (timeout, transient API error). The route
 * still returns a 200 with the partial composite, and the UI can show
 * a degraded banner explaining which signals are missing. (P8)
 */
export interface GeoAnalysisDegradedFlags {
  lighthouse: boolean;
  seo: boolean;
  geo: boolean;
  schema: boolean;
  eeat: boolean;
}

export interface GeoAnalysisResult {
  url: string;
  timestamp: string;
  globalScore: number;
  category: GeoCategory;
  seo: GeoSeoBlock;
  geo: GeoBlock;
  recommendations: GeoRecommendation[];
  projection: GeoProjection;
  warnings?: string[];
  warningMessage?: string;
  /**
   * When present, at least one sub-analyzer failed and the score is
   * computed from a partial dataset. Each `true` flag indicates a
   * failed analyzer whose data is replaced by safe defaults.
   * Absent when all 5 analyzers succeeded.
   */
  degraded?: GeoAnalysisDegradedFlags;
  /**
   * P14.D — LLM-suggested SEO keywords (gpt-4o-mini). Surfaced in
   * HeadingsTab next to the statistical extraction. Absent when the
   * LLM call failed, OPENAI_API_KEY missing, or response malformed.
   */
  keywordSuggestions?: import('./keyword-suggestions').KeywordSuggestionsResult;
}
