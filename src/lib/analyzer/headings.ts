import type { CheerioAPI } from './cheerio';
import type { HeadingsAnalysis, Issue } from '../types';

export function analyzeHeadings($: CheerioAPI, primaryKeyword?: string): HeadingsAnalysis {
  const issues: Issue[] = [];

  const titleEl = $('title').first();
  const titleContent = titleEl.text().trim();
  const titleLength = titleContent.length;
  const titleOptimal = titleLength >= 50 && titleLength <= 60;

  if (!titleContent) {
    issues.push({ type: 'error', message: 'La balise <title> est manquante' });
  } else if (titleLength < 30) {
    issues.push({ type: 'warning', message: `Le titre est trop court (${titleLength} caractères, recommandé: 50-60)` });
  } else if (titleLength > 60) {
    issues.push({ type: 'warning', message: `Le titre est trop long (${titleLength} caractères, recommandé: 50-60)` });
  }

  const metaDesc = $('meta[name="description"]').attr('content')?.trim() || '';
  const metaDescLength = metaDesc.length;
  const metaDescOptimal = metaDescLength >= 150 && metaDescLength <= 160;

  if (!metaDesc) {
    issues.push({ type: 'error', message: 'La méta description est manquante' });
  } else if (metaDescLength < 120) {
    issues.push({ type: 'warning', message: `La méta description est trop courte (${metaDescLength} caractères, recommandé: 150-160)` });
  } else if (metaDescLength > 160) {
    issues.push({ type: 'warning', message: `La méta description est trop longue (${metaDescLength} caractères, recommandé: 150-160)` });
  } else if (metaDescLength < 150) {
    issues.push({ type: 'info', message: `La méta description pourrait être optimisée (${metaDescLength} caractères, optimal: 150-160)` });
  }

  const extract = (tag: string) => {
    const items: string[] = [];
    $(tag).each((_: number, el: any) => {
      items.push($(el).text().trim());
    });
    return items;
  };

  const h1 = extract('h1');
  const h2 = extract('h2');
  const h3 = extract('h3');
  const h4 = extract('h4');
  const h5 = extract('h5');
  const h6 = extract('h6');

  if (h1.length === 0) {
    issues.push({ type: 'error', message: 'Aucune balise H1 trouvée' });
  } else if (h1.length > 1) {
    issues.push({ type: 'warning', message: `${h1.length} balises H1 trouvées (recommandé: 1 seule)` });
  }

  if (h2.length === 0 && (h3.length > 0 || h4.length > 0)) {
    issues.push({ type: 'warning', message: 'Aucune balise H2 mais des H3+ sont présentes' });
  }

  let emptyCount = 0;
  h1.concat(h2, h3, h4, h5, h6).forEach((text) => {
    if (!text) emptyCount++;
  });
  if (emptyCount > 0) {
    issues.push({ type: 'warning', message: `${emptyCount} balise(s) heading vide(s) détectée(s)` });
  }

  // Check for heading level skips
  const levels = [
    h1.length > 0 ? 1 : 0,
    h2.length > 0 ? 2 : 0,
    h3.length > 0 ? 3 : 0,
    h4.length > 0 ? 4 : 0,
    h5.length > 0 ? 5 : 0,
    h6.length > 0 ? 6 : 0,
  ].filter(Boolean);

  // Add baseline if H1 is missing but other headings exist so skip from root is detected
  if (levels.length > 0 && levels[0] !== 1) {
    levels.unshift(1);
  }

  let skipCount = 0;
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) {
      issues.push({ type: 'warning', message: `Niveau de heading sauté: H${levels[i - 1]} → H${levels[i]}` });
      skipCount++;
    }
  }

  // Scoring — strict and realistic
  let score = 100;

  // Title scoring (max -25)
  if (!titleContent) score -= 25;
  else if (!titleOptimal) score -= 8;

  // Meta description scoring (max -20)
  if (!metaDesc) score -= 20;
  else if (!metaDescOptimal) score -= 6;

  // H1 scoring (max -20)
  if (h1.length === 0) score -= 20;
  else if (h1.length > 1) score -= 10;

  // Heading structure (max -15)
  score -= skipCount * 5;
  if (emptyCount > 0) score -= Math.min(10, emptyCount * 3);

  // Heading depth — reward having H2s and H3s
  if (h2.length === 0) score -= 5;

  // Keyword placement penalty (max -15)
  if (primaryKeyword) {
    const kw = primaryKeyword.toLowerCase();
    if (titleContent && !titleContent.toLowerCase().includes(kw)) score -= 8;
    if (h1.length > 0 && !h1.some(h => h.toLowerCase().includes(kw))) score -= 7;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    title: { content: titleContent, length: titleLength, isOptimal: titleOptimal },
    metaDescription: { content: metaDesc, length: metaDescLength, isOptimal: metaDescOptimal },
    h1, h2, h3, h4, h5, h6,
    issues,
  };
}
