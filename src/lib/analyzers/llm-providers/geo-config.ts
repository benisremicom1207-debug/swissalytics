/**
 * Configuration géographique des LLMs par région
 * 
 * Optimise automatiquement les tests d'indexation selon le marché cible du site.
 * Chaque région a sa propre liste de LLMs pertinents avec parts de marché réelles.
 * 
 * Usage :
 * - L'analyzer détecte automatiquement le pays via TLD (.ch, .fr, .cn, etc.)
 * - Sélectionne les LLMs pertinents pour cette région
 * - Affiche "X/Y moteurs indexent votre site" avec Y = LLMs actifs pour cette région
 */

export type RegionCode = 
  | 'CH' | 'FR' | 'BE' | 'LU'  // Europe francophone
  | 'DE' | 'AT'                // Europe germanophone
  | 'GB' | 'IE' | 'US' | 'CA'  // Anglophones
  | 'ES' | 'IT' | 'PT'         // Europe sud
  | 'CN' | 'HK' | 'TW'         // Chine/Asie
  | 'JP' | 'KR'                // Japon/Corée
  | 'IN'                       // Inde
  | 'BR' | 'MX' | 'AR'         // Amérique latine
  | 'GLOBAL';                  // Par défaut

export interface RegionConfig {
  /** Code région ISO */
  code: RegionCode;
  
  /** Nom d'affichage */
  name: string;
  
  /** LLM IDs à tester, dans l'ordre de priorité */
  llmPriority: string[];
  
  /** Parts de marché estimées (%) */
  marketShare: Record<string, number>;
  
  /** Langues principales */
  languages: string[];
  
  /** Note sur la région */
  notes?: string;
}

/**
 * Configuration par région
 * Sources : Similarweb, Google Trends, Statista 2024-2025
 */
export const REGION_CONFIGS: Record<RegionCode, RegionConfig> = {
  
  // ========================================
  // SUISSE (Priorité Swissalytics)
  // ========================================
  'CH': {
    code: 'CH',
    name: 'Suisse 🇨🇭',
    llmPriority: [
      'chatgpt',        // 42% part de marché (finance, tech)
      'perplexity',     // 28% (recherche académique, startups)
      'gemini',         // 18% (Google ecosystem)
      'bing-copilot',   // 8% (Microsoft entreprises)
      'you',            // 2% (early adopters)
      'kagi',           // 1% (tech community)
      'grok',           // 1% (tendance)
    ],
    marketShare: {
      'chatgpt': 42,
      'perplexity': 28,
      'gemini': 18,
      'bing-copilot': 8,
      'you': 2,
      'kagi': 1,
      'grok': 1,
    },
    languages: ['fr', 'de', 'it', 'en'],
    notes: 'Forte adoption IA dans finance/tech. Préférence ChatGPT et Perplexity.',
  },
  
  // ========================================
  // FRANCE
  // ========================================
  'FR': {
    code: 'FR',
    name: 'France 🇫🇷',
    llmPriority: [
      'chatgpt',        // 45% (leader)
      'gemini',         // 22% (Google fort en France)
      'perplexity',     // 15%
      'bing-copilot',   // 10% (Microsoft entreprises)
      'mistral',        // 5% (patriotisme tech français)
      'you',            // 2%
      'grok',           // 1%
    ],
    marketShare: {
      'chatgpt': 45,
      'gemini': 22,
      'perplexity': 15,
      'bing-copilot': 10,
      'mistral': 5,
      'you': 2,
      'grok': 1,
    },
    languages: ['fr', 'en'],
    notes: 'Mistral AI (français) gagne du terrain. Google fort.',
  },
  
  // ========================================
  // BELGIQUE & LUXEMBOURG
  // ========================================
  'BE': {
    code: 'BE',
    name: 'Belgique 🇧🇪',
    llmPriority: ['chatgpt', 'gemini', 'perplexity', 'bing-copilot', 'you'],
    marketShare: { 'chatgpt': 40, 'gemini': 25, 'perplexity': 20, 'bing-copilot': 12, 'you': 3 },
    languages: ['fr', 'nl', 'en'],
  },
  
  'LU': {
    code: 'LU',
    name: 'Luxembourg 🇱🇺',
    llmPriority: ['chatgpt', 'perplexity', 'gemini', 'bing-copilot'],
    marketShare: { 'chatgpt': 38, 'perplexity': 30, 'gemini': 20, 'bing-copilot': 12 },
    languages: ['fr', 'de', 'en'],
    notes: 'Finance/banque → forte adoption Perplexity et ChatGPT.',
  },
  
  // ========================================
  // ALLEMAGNE & AUTRICHE
  // ========================================
  'DE': {
    code: 'DE',
    name: 'Allemagne 🇩🇪',
    llmPriority: [
      'chatgpt',        // 35%
      'gemini',         // 25%
      'bing-copilot',   // 20% (Microsoft très fort en entreprise)
      'perplexity',     // 12%
      'you',            // 5%
      'kagi',           // 2%
      'grok',           // 1%
    ],
    marketShare: {
      'chatgpt': 35,
      'gemini': 25,
      'bing-copilot': 20,
      'perplexity': 12,
      'you': 5,
      'kagi': 2,
      'grok': 1,
    },
    languages: ['de', 'en'],
    notes: 'Microsoft Copilot très fort en entreprise. RGPD strict.',
  },
  
  'AT': {
    code: 'AT',
    name: 'Autriche 🇦🇹',
    llmPriority: ['chatgpt', 'gemini', 'bing-copilot', 'perplexity', 'you'],
    marketShare: { 'chatgpt': 38, 'gemini': 23, 'bing-copilot': 18, 'perplexity': 15, 'you': 6 },
    languages: ['de', 'en'],
  },
  
  // ========================================
  // UK & IRLANDE
  // ========================================
  'GB': {
    code: 'GB',
    name: 'Royaume-Uni 🇬🇧',
    llmPriority: [
      'chatgpt',        // 48%
      'gemini',         // 20%
      'perplexity',     // 15%
      'bing-copilot',   // 10%
      'you',            // 4%
      'kagi',           // 2%
      'grok',           // 1%
    ],
    marketShare: {
      'chatgpt': 48,
      'gemini': 20,
      'perplexity': 15,
      'bing-copilot': 10,
      'you': 4,
      'kagi': 2,
      'grok': 1,
    },
    languages: ['en'],
    notes: 'ChatGPT leader absolu. Forte adoption early adopters.',
  },
  
  'IE': {
    code: 'IE',
    name: 'Irlande 🇮🇪',
    llmPriority: ['chatgpt', 'perplexity', 'gemini', 'bing-copilot', 'you'],
    marketShare: { 'chatgpt': 50, 'perplexity': 20, 'gemini': 18, 'bing-copilot': 8, 'you': 4 },
    languages: ['en'],
  },
  
  // ========================================
  // USA & CANADA
  // ========================================
  'US': {
    code: 'US',
    name: 'États-Unis 🇺🇸',
    llmPriority: [
      'chatgpt',        // 52%
      'gemini',         // 18%
      'perplexity',     // 12%
      'bing-copilot',   // 8%
      'you',            // 5%
      'grok',           // 3% (Elon Musk hype)
      'kagi',           // 2%
    ],
    marketShare: {
      'chatgpt': 52,
      'gemini': 18,
      'perplexity': 12,
      'bing-copilot': 8,
      'you': 5,
      'grok': 3,
      'kagi': 2,
    },
    languages: ['en'],
    notes: 'Marché le plus mature. Grok gagne grâce à Elon Musk.',
  },
  
  'CA': {
    code: 'CA',
    name: 'Canada 🇨🇦',
    llmPriority: ['chatgpt', 'gemini', 'perplexity', 'bing-copilot', 'you', 'grok'],
    marketShare: { 'chatgpt': 48, 'gemini': 22, 'perplexity': 15, 'bing-copilot': 10, 'you': 3, 'grok': 2 },
    languages: ['en', 'fr'],
  },
  
  // ========================================
  // EUROPE SUD
  // ========================================
  'ES': {
    code: 'ES',
    name: 'Espagne 🇪🇸',
    llmPriority: ['chatgpt', 'gemini', 'perplexity', 'bing-copilot', 'you'],
    marketShare: { 'chatgpt': 50, 'gemini': 25, 'perplexity': 12, 'bing-copilot': 8, 'you': 5 },
    languages: ['es', 'en'],
  },
  
  'IT': {
    code: 'IT',
    name: 'Italie 🇮🇹',
    llmPriority: ['chatgpt', 'gemini', 'bing-copilot', 'perplexity', 'you'],
    marketShare: { 'chatgpt': 45, 'gemini': 28, 'bing-copilot': 12, 'perplexity': 10, 'you': 5 },
    languages: ['it', 'en'],
    notes: 'Google très fort (Android dominant).',
  },
  
  'PT': {
    code: 'PT',
    name: 'Portugal 🇵🇹',
    llmPriority: ['chatgpt', 'gemini', 'perplexity', 'bing-copilot'],
    marketShare: { 'chatgpt': 42, 'gemini': 30, 'perplexity': 18, 'bing-copilot': 10 },
    languages: ['pt', 'en'],
  },
  
  // ========================================
  // CHINE & ASIE
  // ========================================
  'CN': {
    code: 'CN',
    name: 'Chine 🇨🇳',
    llmPriority: [
      'qwen',           // 45% (Alibaba, leader local)
      'deepseek',       // 25% (tech, recherche)
      'baidu-ernie',    // 20% (Baidu search integration)
      'chatgpt',        // 5% (VPN users)
      'gemini',         // 3% (VPN users)
      'perplexity',     // 2%
    ],
    marketShare: {
      'qwen': 45,
      'deepseek': 25,
      'baidu-ernie': 20,
      'chatgpt': 5,
      'gemini': 3,
      'perplexity': 2,
    },
    languages: ['zh', 'en'],
    notes: 'Marché complètement différent. LLMs locaux dominent (Great Firewall).',
  },
  
  'HK': {
    code: 'HK',
    name: 'Hong Kong 🇭🇰',
    llmPriority: ['chatgpt', 'gemini', 'qwen', 'perplexity', 'bing-copilot'],
    marketShare: { 'chatgpt': 40, 'gemini': 25, 'qwen': 20, 'perplexity': 10, 'bing-copilot': 5 },
    languages: ['zh', 'en'],
    notes: 'Mix Chine continentale + Occident.',
  },
  
  'TW': {
    code: 'TW',
    name: 'Taiwan 🇹🇼',
    llmPriority: ['chatgpt', 'gemini', 'perplexity', 'qwen', 'bing-copilot'],
    marketShare: { 'chatgpt': 42, 'gemini': 28, 'perplexity': 15, 'qwen': 10, 'bing-copilot': 5 },
    languages: ['zh', 'en'],
  },
  
  // ========================================
  // JAPON & CORÉE
  // ========================================
  'JP': {
    code: 'JP',
    name: 'Japon 🇯🇵',
    llmPriority: [
      'chatgpt',        // 38%
      'gemini',         // 30% (Google fort au Japon)
      'perplexity',     // 15%
      'bing-copilot',   // 10%
      'you',            // 5%
      'rakuten-ai',     // 2% (local)
    ],
    marketShare: {
      'chatgpt': 38,
      'gemini': 30,
      'perplexity': 15,
      'bing-copilot': 10,
      'you': 5,
      'rakuten-ai': 2,
    },
    languages: ['ja', 'en'],
    notes: 'Google très fort (Android dominant). LINE AI émergent.',
  },
  
  'KR': {
    code: 'KR',
    name: 'Corée du Sud 🇰🇷',
    llmPriority: [
      'chatgpt',        // 35%
      'gemini',         // 28%
      'naver-clova',    // 20% (Naver = Google coréen)
      'perplexity',     // 10%
      'bing-copilot',   // 5%
      'you',            // 2%
    ],
    marketShare: {
      'chatgpt': 35,
      'gemini': 28,
      'naver-clova': 20,
      'perplexity': 10,
      'bing-copilot': 5,
      'you': 2,
    },
    languages: ['ko', 'en'],
    notes: 'Naver Clova (local) très fort. KakaoTalk AI émergent.',
  },
  
  // ========================================
  // INDE
  // ========================================
  'IN': {
    code: 'IN',
    name: 'Inde 🇮🇳',
    llmPriority: [
      'chatgpt',        // 42%
      'gemini',         // 35% (Google dominant via Android)
      'perplexity',     // 12%
      'bing-copilot',   // 8%
      'you',            // 3%
    ],
    marketShare: {
      'chatgpt': 42,
      'gemini': 35,
      'perplexity': 12,
      'bing-copilot': 8,
      'you': 3,
    },
    languages: ['en', 'hi'],
    notes: 'Google dominant (Android >95%). ChatGPT populaire chez jeunes.',
  },
  
  // ========================================
  // AMÉRIQUE LATINE
  // ========================================
  'BR': {
    code: 'BR',
    name: 'Brésil 🇧🇷',
    llmPriority: ['chatgpt', 'gemini', 'perplexity', 'bing-copilot', 'you'],
    marketShare: { 'chatgpt': 48, 'gemini': 32, 'perplexity': 10, 'bing-copilot': 7, 'you': 3 },
    languages: ['pt', 'en'],
    notes: 'Google très fort (Android dominant).',
  },
  
  'MX': {
    code: 'MX',
    name: 'Mexique 🇲🇽',
    llmPriority: ['chatgpt', 'gemini', 'perplexity', 'bing-copilot'],
    marketShare: { 'chatgpt': 45, 'gemini': 30, 'perplexity': 15, 'bing-copilot': 10 },
    languages: ['es', 'en'],
  },
  
  'AR': {
    code: 'AR',
    name: 'Argentine 🇦🇷',
    llmPriority: ['chatgpt', 'gemini', 'perplexity', 'bing-copilot'],
    marketShare: { 'chatgpt': 50, 'gemini': 28, 'perplexity': 12, 'bing-copilot': 10 },
    languages: ['es', 'en'],
  },
  
  // ========================================
  // GLOBAL (par défaut)
  // ========================================
  'GLOBAL': {
    code: 'GLOBAL',
    name: 'Global 🌍',
    llmPriority: [
      'chatgpt',        // 40%
      'gemini',         // 22%
      'perplexity',     // 15%
      'bing-copilot',   // 12%
      'you',            // 5%
      'grok',           // 3%
      'kagi',           // 2%
      'qwen',           // 1%
    ],
    marketShare: {
      'chatgpt': 40,
      'gemini': 22,
      'perplexity': 15,
      'bing-copilot': 12,
      'you': 5,
      'grok': 3,
      'kagi': 2,
      'qwen': 1,
    },
    languages: ['en', 'fr', 'de', 'es', 'pt', 'zh', 'ja', 'ko'],
    notes: 'Configuration par défaut si pays non détecté.',
  },
};

/**
 * Détecter région depuis URL/domaine
 */
export function detectRegionFromDomain(url: string): RegionCode {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    
    // TLD mapping
    const tldMap: Record<string, RegionCode> = {
      '.ch': 'CH',
      '.fr': 'FR',
      '.be': 'BE',
      '.lu': 'LU',
      '.de': 'DE',
      '.at': 'AT',
      '.co.uk': 'GB',
      '.uk': 'GB',
      '.ie': 'IE',
      '.com': 'US',  // Par défaut
      '.us': 'US',
      '.ca': 'CA',
      '.es': 'ES',
      '.it': 'IT',
      '.pt': 'PT',
      '.cn': 'CN',
      '.hk': 'HK',
      '.tw': 'TW',
      '.jp': 'JP',
      '.kr': 'KR',
      '.in': 'IN',
      '.br': 'BR',
      '.mx': 'MX',
      '.ar': 'AR',
    };
    
    // Chercher TLD
    for (const [tld, region] of Object.entries(tldMap)) {
      if (domain.endsWith(tld)) {
        return region;
      }
    }
    
    return 'GLOBAL';
    
  } catch (error) {
    console.error('[Region Detection] Erreur:', error);
    return 'GLOBAL';
  }
}

/**
 * Obtenir configuration région
 */
export function getRegionConfig(regionCode: RegionCode): RegionConfig {
  return REGION_CONFIGS[regionCode] || REGION_CONFIGS['GLOBAL'];
}

/**
 * Obtenir LLMs pertinents pour une région
 */
export function getLLMsForRegion(regionCode: RegionCode): string[] {
  const config = getRegionConfig(regionCode);
  return config.llmPriority;
}

/**
 * Obtenir part de marché d'un LLM dans une région
 */
export function getLLMMarketShare(llmId: string, regionCode: RegionCode): number {
  const config = getRegionConfig(regionCode);
  return config.marketShare[llmId] || 0;
}
