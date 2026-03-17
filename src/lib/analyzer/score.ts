import type { AnalysisResult } from '../types';

export function calculateGlobalScore(result: Omit<AnalysisResult, 'score' | 'url' | 'timestamp'>): number {
  const weights = {
    headings: 0.20,
    images: 0.10,
    links: 0.10,
    technical: 0.25,
    metadata: 0.15,
    readability: 0.20,
  };

  const weighted =
    result.headings.score * weights.headings +
    result.images.score * weights.images +
    result.links.score * weights.links +
    result.technical.score * weights.technical +
    result.metadata.score * weights.metadata +
    result.readability.score * weights.readability;

  // Only critical issues further reduce global score
  // (warnings already penalize individual category scores)
  const allIssues = [
    ...result.headings.issues,
    ...result.images.issues,
    ...result.links.issues,
    ...result.technical.issues,
    ...result.metadata.issues,
    ...result.readability.issues,
    ...result.keywords.issues,
  ];

  const criticalCount = allIssues.filter(i => i.type === 'error').length;
  const penalty = criticalCount * 2;

  return Math.max(0, Math.min(100, Math.round(weighted - penalty)));
}
