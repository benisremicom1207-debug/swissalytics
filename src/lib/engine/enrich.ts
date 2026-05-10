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
    // P18.B backwards-compat: legacy stored reports kept keywordSuggestions
    // INSIDE geoAnalysis. Hoist to top-level if present so the new UI
    // (which reads report.keywordSuggestions) keeps showing them.
    const legacy = (stored.geoAnalysis as { keywordSuggestions?: unknown }).keywordSuggestions;
    report = { ...report, geoAnalysis: stored.geoAnalysis };
    if (legacy && !stored.keywordSuggestions) {
      report = { ...report, keywordSuggestions: legacy as AnalysisReport['keywordSuggestions'] };
    }
  }

  // P18.B — top-level keywordSuggestions wins over the legacy nested one.
  if (stored.keywordSuggestions) {
    report = { ...report, keywordSuggestions: stored.keywordSuggestions };
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
