/**
 * Registry LLM extensible pour GEO Analyzer
 * 
 * Architecture modulaire permettant d'ajouter/retirer facilement des LLMs
 * sans modifier le code core de l'analyzer.
 * 
 * Ajouter un nouveau LLM :
 * 1. Créer fichier provider (ex: grok.ts)
 * 2. Implémenter interface LLMProvider
 * 3. Enregistrer dans LLM_REGISTRY ci-dessous
 * 4. Ajouter variables .env (optionnel)
 */

export interface LLMTestResult {
  indexed: boolean;
  mentions: number;
  confidence: 'high' | 'medium' | 'low' | 'none';
  metadata?: {
    sources?: string[];
    responseTime?: number;
    error?: string;
  };
}

export interface LLMProvider {
  /** ID unique du provider (ex: 'grok', 'qwen') */
  id: string;
  
  /** Nom d'affichage (ex: 'Grok', 'Qwen 2.5') */
  name: string;
  
  /** Entreprise (ex: 'xAI', 'Alibaba') */
  company: string;
  
  /** Actif par défaut (sans clé API nécessaire) */
  defaultEnabled: boolean;
  
  /** Variable d'environnement pour la clé API (ex: 'GROK_API_KEY') */
  apiKeyEnvVar?: string;
  
  /** Variable d'environnement pour activer/désactiver (ex: 'ENABLE_GROK') */
  enableEnvVar?: string;
  
  /** URL documentation API */
  docsUrl?: string;
  
  /** Icône/logo (optionnel) */
  icon?: string;
  
  /**
   * Tester si le site est indexé par ce LLM
   * @param brandName - Nom de marque (ex: 'swissalytics')
   * @param domain - Domaine (ex: 'swissalytics.com')
   * @returns Résultat de l'indexation
   */
  testIndexation(brandName: string, domain: string): Promise<LLMTestResult>;
  
  /**
   * Vérifier si le provider est activé
   * @returns true si clé API configurée OU defaultEnabled
   */
  isEnabled(): boolean;
}

/**
 * Configuration LLM Registry
 */
export interface LLMRegistryConfig {
  /** LLMs actifs (filtrés par isEnabled()) */
  enabled: LLMProvider[];
  
  /** Tous les LLMs disponibles */
  all: LLMProvider[];
  
  /** Nombre total de LLMs actifs */
  totalEnabled: number;
  
  /** Région détectée */
  region?: string;
  
  /** LLMs pertinents pour cette région */
  relevantForRegion?: LLMProvider[];
}

/**
 * Registry global des LLMs
 * 
 * Import providers ici pour les activer.
 * 
 * Liste complète optimisée par région (auto-sélection via geo-config.ts) :
 * - Europe francophone : ChatGPT, Perplexity, Gemini, Bing, Mistral
 * - Europe germanophone : ChatGPT, Gemini, Bing, Perplexity
 * - Anglophones : ChatGPT, Gemini, Perplexity, Bing, You, Grok, Kagi
 * - Chine : Qwen, DeepSeek, Baidu ERNIE
 * - Corée : Naver Clova, ChatGPT, Gemini
 * - Global : ChatGPT, Gemini, Perplexity, Bing, You, Grok, Kagi
 */
import { ChatGPTProvider } from './chatgpt';
import { PerplexityProvider } from './perplexity';
import { GeminiProvider } from './gemini';
import { BingCopilotProvider } from './bing-copilot';
import { YouProvider } from './you';
import { GrokProvider } from './grok';
import { KagiProvider } from './kagi';
import { MistralProvider } from './mistral';
import { QwenProvider } from './qwen';
import { DeepSeekProvider } from './deepseek';
import { BaiduErnieProvider } from './baidu-ernie';
import { NaverClovaProvider } from './naver-clova';

export const LLM_REGISTRY: LLMProvider[] = [
  // ===== TIER 1 : GLOBAUX (tous les marchés) =====
  new ChatGPTProvider(),      // Leader mondial ~40-50%
  new GeminiProvider(),        // Google ~15-30%
  new PerplexityProvider(),   // Recherche IA ~10-25%
  new BingCopilotProvider(),   // Microsoft ~8-20%
  
  // ===== TIER 2 : OCCIDENTAUX (USA, Europe, Canada) =====
  new YouProvider(),           // Émergent ~2-5%
  new GrokProvider(),          // xAI / Elon Musk ~1-3%
  new KagiProvider(),          // Early adopters tech ~1-2%
  new MistralProvider(),       // France/Europe ~3-5%
  
  // ===== TIER 3 : ASIATIQUES (Chine, Corée, Japon) =====
  new QwenProvider(),          // Alibaba / Chine ~20-45%
  new DeepSeekProvider(),      // Chine tech ~10-25%
  new BaiduErnieProvider(),    // Baidu / Chine ~15-20%
  new NaverClovaProvider(),    // Naver / Corée ~15-20%
];

/**
 * Obtenir configuration registry
 */
export function getLLMRegistry(url?: string): LLMRegistryConfig {
  const enabled = LLM_REGISTRY.filter(provider => provider.isEnabled());
  
  let region: string | undefined;
  let relevantForRegion: LLMProvider[] | undefined;
  
  // Si URL fournie, détecter région et filtrer LLMs pertinents
  if (url) {
    try {
      const { detectRegionFromDomain, getLLMsForRegion, getRegionConfig } = require('./geo-config');
      const regionCode = detectRegionFromDomain(url);
      const regionConfig = getRegionConfig(regionCode);
      const relevantLLMIds = getLLMsForRegion(regionCode);
      
      region = `${regionConfig.name} (${regionCode})`;
      
      // Filtrer LLMs pertinents ET actifs, dans l'ordre de priorité régionale
      relevantForRegion = relevantLLMIds
        .map((id: string) => LLM_REGISTRY.find(p => p.id === id))
        .filter((p: LLMProvider | undefined): p is LLMProvider => p !== undefined && p.isEnabled());
      
      console.log(`[LLM Registry] Région détectée: ${region}`);
      if (relevantForRegion && relevantForRegion.length > 0) {
        console.log(`[LLM Registry] LLMs pertinents: ${relevantForRegion.map(p => p.name).join(', ')}`);
      }
    } catch (error) {
      console.warn('[LLM Registry] Erreur détection région:', error);
    }
  }
  
  return {
    enabled,
    all: LLM_REGISTRY,
    totalEnabled: enabled.length,
    region,
    relevantForRegion,
  };
}

/**
 * Obtenir provider par ID
 */
export function getLLMProvider(id: string): LLMProvider | undefined {
  return LLM_REGISTRY.find(p => p.id === id);
}

/**
 * Tester tous les LLMs actifs
 * @param url - URL facultative pour détection région et filtrage LLMs pertinents
 */
export async function testAllLLMs(
  brandName: string,
  domain: string,
  url?: string
): Promise<Map<string, LLMTestResult>> {
  const registry = getLLMRegistry(url);
  const results = new Map<string, LLMTestResult>();
  
  // Utiliser LLMs pertinents pour la région si disponible, sinon tous les actifs
  const llmsToTest = registry.relevantForRegion || registry.enabled;
  
  console.log(`[LLM Registry] Test de ${llmsToTest.length} LLMs actifs...`);
  if (registry.region) {
    console.log(`[LLM Registry] Optimisé pour: ${registry.region}`);
  }
  
  // Tests parallèles
  const tests = llmsToTest.map(async (provider) => {
    try {
      console.log(`[LLM Registry] Test ${provider.name}...`);
      const result = await provider.testIndexation(brandName, domain);
      results.set(provider.id, result);
    } catch (error) {
      console.error(`[LLM Registry] Erreur ${provider.name}:`, error);
      results.set(provider.id, {
        indexed: false,
        mentions: 0,
        confidence: 'none',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  });
  
  await Promise.all(tests);
  
  return results;
}

/**
 * Helper pour vérifier si une clé API est configurée
 */
export function hasAPIKey(envVar: string): boolean {
  const key = process.env[envVar];
  return !!(key && key.length > 0);
}

/**
 * Helper pour vérifier si un provider est explicitement activé via .env
 */
export function isExplicitlyEnabled(envVar: string): boolean {
  const value = process.env[envVar];
  return value === 'true' || value === '1';
}

/**
 * Helper pour vérifier si un provider est explicitement désactivé via .env
 */
export function isExplicitlyDisabled(envVar: string): boolean {
  const value = process.env[envVar];
  return value === 'false' || value === '0';
}
