/**
 * Calculateur Score Composite GEO/SEO
 * 
 * Agrège tous les scores analyseurs pour produire:
 * - Score global 0-100
 * - Détails SEO (50%) vs GEO (50%)
 * - Top recommandations prioritaires
 * - Projection amélioration 3/6 mois
 */

import { LighthouseResult } from './lighthouse';
import { SEOResult } from './seo';
import { GEOIndexationResult } from './geo-indexation';
import { SchemaOrgResult } from './schema-org';
import { EEATResult } from './eeat';

export interface CompositeScoreResult {
  globalScore: number;
  category: 'Excellent' | 'Bon' | 'Moyen' | 'Faible' | 'Critique';
  seo: {
    score: number;
    breakdown: {
      lighthouse: number; // 45% du SEO
      technicalSEO: number; // 30% du SEO
      content: number; // 25% du SEO
    };
  };
  geo: {
    score: number;
    breakdown: {
      indexation: number; // 35% du GEO
      schema: number; // 25% du GEO
      eeat: number; // 40% du GEO
    };
  };
  topRecommendations: Recommendation[];
  projection: {
    threeMonths: ProjectionData;
    sixMonths: ProjectionData;
  };
}

export interface Recommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: number; // Points gagnés potentiels
  difficulty: 'low' | 'medium' | 'high';
  category: 'seo' | 'geo';
  timeframe: '1 semaine' | '2-4 semaines' | '1-3 mois';
}

export interface ProjectionData {
  estimatedScore: number;
  gain: number;
  quickWins: string[];
  requiredActions: string[];
}

export function calculateCompositeScore(data: {
  lighthouse: LighthouseResult;
  seo: SEOResult;
  geo: GEOIndexationResult;
  schema: SchemaOrgResult;
  eeat: EEATResult;
}): CompositeScoreResult {
  console.log('[Composite] Calcul score final...');
  
  // ========== SCORE SEO (50% du global) ==========
  
  // Lighthouse = 45% du SEO
  const lighthouseScore = Math.round(
    (data.lighthouse.performance * 0.25) +
    (data.lighthouse.accessibility * 0.15) +
    (data.lighthouse.bestPractices * 0.15) +
    (data.lighthouse.seo * 0.45)
  );
  
  // SEO technique (meta tags, headings, images) = 30% du SEO
  const technicalSEOScore = data.seo.score;
  
  // Contenu (structure, qualité) = 25% du SEO
  const contentScore = Math.round(
    (data.seo.headings.score * 0.6) +
    (data.seo.images.score * 0.4)
  );
  
  const seoScore = Math.round(
    (lighthouseScore * 0.45) +
    (technicalSEOScore * 0.30) +
    (contentScore * 0.25)
  );
  
  // ========== SCORE GEO (50% du global) ==========
  
  // Indexation IA = 35% du GEO
  const indexationScore = data.geo.score;
  
  // Schema.org = 25% du GEO
  const schemaScore = data.schema.score;
  
  // E-E-A-T = 40% du GEO
  const eeatScore = data.eeat.score;
  
  const geoScore = Math.round(
    (indexationScore * 0.35) +
    (schemaScore * 0.25) +
    (eeatScore * 0.40)
  );
  
  // ========== SCORE GLOBAL (moyenne SEO + GEO) ==========
  
  const globalScore = Math.round((seoScore + geoScore) / 2);
  
  // Catégorie
  let category: CompositeScoreResult['category'];
  if (globalScore >= 80) category = 'Excellent';
  else if (globalScore >= 65) category = 'Bon';
  else if (globalScore >= 50) category = 'Moyen';
  else if (globalScore >= 30) category = 'Faible';
  else category = 'Critique';
  
  // ========== RECOMMANDATIONS ==========
  
  const recommendations = generateTopRecommendations(data, {
    seoScore,
    geoScore,
    globalScore,
  });
  
  // ========== PROJECTION ==========
  
  const projection = calculateProjection(globalScore, recommendations);
  
  return {
    globalScore,
    category,
    seo: {
      score: seoScore,
      breakdown: {
        lighthouse: lighthouseScore,
        technicalSEO: technicalSEOScore,
        content: contentScore,
      },
    },
    geo: {
      score: geoScore,
      breakdown: {
        indexation: indexationScore,
        schema: schemaScore,
        eeat: eeatScore,
      },
    },
    topRecommendations: recommendations,
    projection,
  };
}

/**
 * Générer top 5 recommandations prioritaires
 */
function generateTopRecommendations(
  data: {
    lighthouse: LighthouseResult;
    seo: SEOResult;
    geo: GEOIndexationResult;
    schema: SchemaOrgResult;
    eeat: EEATResult;
  },
  scores: {
    seoScore: number;
    geoScore: number;
    globalScore: number;
  }
): Recommendation[] {
  const recs: Recommendation[] = [];
  
  // ===== RECOMMANDATIONS SEO =====
  
  // Lighthouse Performance < 50
  if (data.lighthouse.performance < 50) {
    recs.push({
      priority: 'critical',
      title: 'Optimiser performance (Core Web Vitals)',
      description: 'Améliorer LCP, FID, CLS pour atteindre score >80/100',
      impact: 20,
      difficulty: 'high',
      category: 'seo',
      timeframe: '2-4 semaines',
    });
  }
  
  // Meta tags non optimaux
  if (!data.seo.metaTags.title.optimal || !data.seo.metaTags.description.optimal) {
    recs.push({
      priority: 'high',
      title: 'Optimiser meta title et description',
      description: 'Title 30-60 caractères, Description 120-160 caractères',
      impact: 12,
      difficulty: 'low',
      category: 'seo',
      timeframe: '1 semaine',
    });
  }
  
  // Images sans alt
  if (data.seo.images.percentageWithAlt < 80) {
    recs.push({
      priority: 'medium',
      title: `Ajouter alt text à ${data.seo.images.missingAlt} images`,
      description: 'Améliorer accessibilité et SEO images',
      impact: 8,
      difficulty: 'low',
      category: 'seo',
      timeframe: '1 semaine',
    });
  }
  
  // Sitemap manquant
  if (!data.seo.sitemap) {
    recs.push({
      priority: 'high',
      title: 'Créer sitemap.xml',
      description: 'Faciliter indexation Google et moteurs recherche',
      impact: 10,
      difficulty: 'low',
      category: 'seo',
      timeframe: '1 semaine',
    });
  }
  
  // ===== RECOMMANDATIONS GEO =====
  
  // Indexation IA faible (< 2 moteurs)
  if (data.geo.totalIndexed < 2) {
    recs.push({
      priority: 'critical',
      title: 'Améliorer indexation moteurs IA (ChatGPT, Perplexity, etc.)',
      description: 'Créer contenu de qualité, implémenter Schema.org, obtenir backlinks',
      impact: 25,
      difficulty: 'high',
      category: 'geo',
      timeframe: '1-3 mois',
    });
  }
  
  // Schema.org Author manquant
  if (!data.schema.schemas.author) {
    recs.push({
      priority: 'critical',
      title: 'Implémenter Author Schema (Person/ProfilePage)',
      description: 'Signal E-E-A-T fort pour indexation IA et Google',
      impact: 18,
      difficulty: 'low',
      category: 'geo',
      timeframe: '1 semaine',
    });
  }
  
  // Schema.org Organization manquant
  if (!data.schema.schemas.organization) {
    recs.push({
      priority: 'high',
      title: 'Ajouter Organization Schema avec logo et contact',
      description: 'Améliorer E-E-A-T et Rich Snippets Google',
      impact: 15,
      difficulty: 'low',
      category: 'geo',
      timeframe: '1 semaine',
    });
  }
  
  // E-E-A-T: Pas de page équipe
  if (!data.eeat.signals.teamPage.found) {
    recs.push({
      priority: 'critical',
      title: 'Créer page équipe détaillée',
      description: 'Photos, bios, expertise de chaque membre pour E-E-A-T',
      impact: 20,
      difficulty: 'medium',
      category: 'geo',
      timeframe: '2-4 semaines',
    });
  }
  
  // E-E-A-T: Pas de testimonials
  if (!data.eeat.signals.testimonials.found) {
    recs.push({
      priority: 'high',
      title: 'Publier témoignages clients avec Review Schema',
      description: 'Renforcer crédibilité et E-E-A-T',
      impact: 14,
      difficulty: 'medium',
      category: 'geo',
      timeframe: '2-4 semaines',
    });
  }
  
  // FAQ Schema manquant
  if (!data.schema.schemas.faqPage) {
    recs.push({
      priority: 'medium',
      title: 'Créer page FAQ avec FAQPage Schema',
      description: 'Rich Snippets Google + contenu conversationnel pour IA',
      impact: 12,
      difficulty: 'medium',
      category: 'geo',
      timeframe: '1 semaine',
    });
  }
  
  // Backlinks faibles
  if (data.eeat.signals.backlinks.quality === 'low' || data.eeat.signals.backlinks.quality === 'none') {
    recs.push({
      priority: 'medium',
      title: 'Obtenir backlinks de sites autoritaires',
      description: 'Guest posts, partenariats, contenu linkable',
      impact: 16,
      difficulty: 'high',
      category: 'geo',
      timeframe: '1-3 mois',
    });
  }
  
  // Trier par impact décroissant et garder top 5
  return recs
    .sort((a, b) => {
      // Priorité critical > high > medium > low
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Si même priorité, trier par impact
      return b.impact - a.impact;
    })
    .slice(0, 5);
}

/**
 * Calculer projection amélioration
 */
function calculateProjection(
  currentScore: number,
  recommendations: Recommendation[]
): CompositeScoreResult['projection'] {
  // Quick wins (low difficulty)
  const quickWins = recommendations
    .filter(r => r.difficulty === 'low')
    .slice(0, 3)
    .map(r => r.title);
  
  // Gain potentiel 3 mois (quick wins + 1 action medium)
  const threeMonthsGain = recommendations
    .filter(r => r.difficulty === 'low' || (r.difficulty === 'medium' && r.timeframe !== '1-3 mois'))
    .reduce((sum, r) => sum + r.impact, 0);
  
  const threeMonthsScore = Math.min(100, currentScore + Math.round(threeMonthsGain * 0.7)); // 70% réalisation
  
  // Gain potentiel 6 mois (tous quick wins + medium + 1 high)
  const sixMonthsGain = recommendations
    .reduce((sum, r) => sum + r.impact, 0);
  
  const sixMonthsScore = Math.min(100, currentScore + Math.round(sixMonthsGain * 0.85)); // 85% réalisation
  
  // Actions requises
  const requiredActionsThreeMonths = recommendations
    .filter(r => r.priority === 'critical' || r.priority === 'high')
    .slice(0, 3)
    .map(r => r.title);
  
  const requiredActionsSixMonths = recommendations
    .filter(r => r.priority === 'critical' || r.priority === 'high')
    .map(r => r.title);
  
  return {
    threeMonths: {
      estimatedScore: threeMonthsScore,
      gain: threeMonthsScore - currentScore,
      quickWins,
      requiredActions: requiredActionsThreeMonths,
    },
    sixMonths: {
      estimatedScore: sixMonthsScore,
      gain: sixMonthsScore - currentScore,
      quickWins,
      requiredActions: requiredActionsSixMonths,
    },
  };
}
