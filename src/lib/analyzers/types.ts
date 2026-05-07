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
}
