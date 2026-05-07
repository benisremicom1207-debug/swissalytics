/**
 * @deprecated The canonical type lives in `src/lib/analyzers/types.ts` as
 * `GeoAnalysisResult`. This file remains as a re-export shim so legacy dead
 * components (AnalyzerHero, AnalyzerLoading, AnalyzerResults — all unused) can
 * still type-check until they're deleted in Phase 6 (cleanup).
 *
 * Do not import from this path in new code.
 */

export type { GeoAnalysisResult as AnalysisResult } from '@/lib/analyzers/types';
