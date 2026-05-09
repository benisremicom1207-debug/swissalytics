/**
 * mergeEnrichment — re-applies the asynchronously-stored geoAnalysis + cwv
 * payloads onto a StoredReport's `data` blob, producing the same shape the
 * homepage state holds at the end of all enrichment fetches. Used by the
 * /api/report/[id] and /api/share/[slug] read paths so /r/<id> and /s/<slug>
 * see the fully-enriched view, not the raw analyze snapshot.
 *
 * Mirrors the transformation in src/app/page.tsx (geo merge + CWV penalty
 * + recompute global score). Keep these in sync if the page-side ever changes.
 */

import type { AnalysisReport, StoredReport } from './types';
import { calculateGlobalScore } from '@/lib/analyzer/score';

export function mergeEnrichment(stored: StoredReport): AnalysisReport {
  let report = stored.data;

  if (stored.geoAnalysis) {
    report = { ...report, geoAnalysis: stored.geoAnalysis };
  }

  const cwv = stored.cwv;
  if (cwv?.coreWebVitals && (cwv.coreWebVitals.mobile || cwv.coreWebVitals.desktop)) {
    const newTechScore = Math.max(0, report.technical.score - cwv.cwvScorePenalty);
    const updatedTechnical = {
      ...report.technical,
      coreWebVitals: cwv.coreWebVitals,
      score: newTechScore,
      issues: [...report.technical.issues, ...cwv.cwvIssues],
    };
    const newGlobal = calculateGlobalScore({ ...report, technical: updatedTechnical });
    report = { ...report, technical: updatedTechnical, score: newGlobal };
  }

  return report;
}
