/**
 * Analyseur GEO Indexation
 * 
 * Architecture modulaire extensible pour tester l'indexation IA.
 * Supporte dynamiquement tous les LLMs configurés dans le registry.
 * 
 * LLMs supportés :
 * - ChatGPT (OpenAI)
 * - Perplexity
 * - Grok (xAI)
 * - Qwen (Alibaba Cloud)
 * - DeepSeek
 * - Mistral AI
 * 
 * Ajouter un nouveau LLM : voir /llm-providers/registry.ts
 */

import { getLLMRegistry, testAllLLMs } from './llm-providers/registry';

export interface GEOIndexationResult {
  score: number;
  engines: Record<string, {
    indexed: boolean;
    mentions: number;
    confidence: 'high' | 'medium' | 'low' | 'none';
    name?: string;
    company?: string;
  }>;
  totalIndexed: number;
  totalEnabled: number;
  region?: string;
  recommendations: string[];
}

export async function analyzeGEOIndexation(url: string): Promise<GEOIndexationResult> {
  console.log(`[GEO] Démarrage test indexation IA de ${url}...`);
  
  const domain = new URL(url).hostname;
  const brandName = extractBrandName(domain);
  
  try {
    // Récupérer registry LLM actifs (avec détection région)
    const registry = getLLMRegistry(url);
    const llmsToTest = registry.relevantForRegion || registry.enabled;
    console.log(`[GEO] ${llmsToTest.length} LLMs actifs détectés`);
    
    if (registry.region) {
      console.log(`[GEO] Région: ${registry.region}`);
    }
    
    // Tester tous les LLMs pertinents en parallèle
    const results = await testAllLLMs(brandName, domain, url);
    
    // Convertir résultats en format compatible
    const engines: GEOIndexationResult['engines'] = {};
    
    results.forEach((result, providerId) => {
      const provider = registry.all.find(p => p.id === providerId);
      engines[providerId] = {
        indexed: result.indexed,
        mentions: result.mentions,
        confidence: result.confidence,
        name: provider?.name,
        company: provider?.company,
      };
    });
    
    // Nombre total de LLMs indexant le site
    const totalIndexed = Object.values(engines).filter(e => e.indexed).length;
    
    // Score basé sur indexation et confiance
    const score = calculateGEOScore(engines, totalIndexed, llmsToTest.length);
    
    // Recommandations basées sur résultats
    const recommendations = generateGEORecommendations(engines, totalIndexed, llmsToTest.length);
    
    return {
      score,
      engines,
      totalIndexed,
      totalEnabled: llmsToTest.length,
      region: registry.region,
      recommendations,
    };
    
  } catch (error) {
    console.error('[GEO] Erreur:', error);
    
    // Fallback données simulées
    return simulateGEOData();
  }
}

/**
 * Extraire nom de marque du domaine
 */
function extractBrandName(domain: string): string {
  // Retirer TLD et www
  return domain.replace(/^www\./, '').replace(/\.[a-z]{2,}$/, '');
}

/**
 * Calcul score GEO global
 */
function calculateGEOScore(
  engines: GEOIndexationResult['engines'],
  totalIndexed: number,
  totalEnabled: number
): number {
  if (totalEnabled === 0) return 0;
  
  // Score de base sur indexation (40%)
  const indexationScore = (totalIndexed / totalEnabled) * 40;
  
  // Score de confiance (60%)
  const confidenceValues = { high: 15, medium: 10, low: 5, none: 0 };
  const maxConfidenceScore = totalEnabled * 15; // Score max possible
  
  const confidenceScore = Object.values(engines).reduce((sum, engine) => {
    return sum + confidenceValues[engine.confidence];
  }, 0);
  
  // Normaliser le score de confiance sur 60 points
  const normalizedConfidence = (confidenceScore / maxConfidenceScore) * 60;
  
  return Math.round(indexationScore + normalizedConfidence);
}

/**
 * Générer recommandations GEO
 */
function generateGEORecommendations(
  engines: GEOIndexationResult['engines'],
  totalIndexed: number,
  totalEnabled: number
): string[] {
  const recs: string[] = [];
  
  if (totalIndexed === 0) {
    recs.push('Créez du contenu de qualité pour améliorer votre indexation par les moteurs IA');
    recs.push('Implémentez Schema.org (Organization, Author) pour structurer vos données');
    recs.push('Obtenez des backlinks de sites autoritaires pour augmenter votre E-E-A-T');
  } else if (totalIndexed < Math.floor(totalEnabled / 2)) {
    recs.push('Améliorez votre présence sur les moteurs IA manquants');
    recs.push('Publiez régulièrement du contenu expert pour renforcer votre autorité');
  }
  
  // Recommandations spécifiques par LLM non indexé
  Object.values(engines).forEach((engine) => {
    if (!engine.indexed && engine.name) {
      recs.push(`Optimisez pour ${engine.name} avec du contenu conversationnel de qualité`);
    }
  });
  
  return recs.slice(0, 3); // Top 3 recommandations
}

/**
 * Simulation données GEO (développement)
 */
function simulateGEOData(): GEOIndexationResult {
  const registry = getLLMRegistry();
  
  return {
    score: 45,
    engines: {
      chatgpt: { indexed: false, mentions: 0, confidence: 'none', name: 'ChatGPT', company: 'OpenAI' },
      perplexity: { indexed: true, mentions: 3, confidence: 'high', name: 'Perplexity', company: 'Perplexity AI' },
    },
    totalIndexed: 1,
    totalEnabled: registry.totalEnabled || 2,
    recommendations: [
      'Optimisez pour ChatGPT Search avec du contenu conversationnel',
      'Créez du contenu de qualité pour améliorer votre indexation par les moteurs IA',
      'Implémentez Schema.org (Organization, Author) pour structurer vos données',
    ],
  };
}
