/**
 * Naver Clova Provider (Corée du Sud)
 * 
 * Test indexation via Naver Clova API (Naver = Google coréen)
 * Essentiel pour sites ciblant le marché sud-coréen
 */

import { LLMProvider, LLMTestResult, hasAPIKey } from './registry';

export class NaverClovaProvider implements LLMProvider {
  id = 'naver-clova';
  name = 'Naver Clova';
  company = 'Naver';
  defaultEnabled = false;
  apiKeyEnvVar = 'NAVER_API_KEY';
  enableEnvVar = 'ENABLE_NAVER_INDEXATION';
  docsUrl = 'https://www.ncloud.com/product/aiService/clovaStudio';
  icon = '🇰🇷';

  isEnabled(): boolean {
    return hasAPIKey(this.apiKeyEnvVar!);
  }

  async testIndexation(brandName: string, domain: string): Promise<LLMTestResult> {
    const apiKey = process.env[this.apiKeyEnvVar!];
    
    if (!apiKey) {
      console.warn(`[${this.name}] API key non configurée`);
      return {
        indexed: false,
        mentions: 0,
        confidence: 'none',
        metadata: { error: 'API key manquante' },
      };
    }

    try {
      // Naver Clova API (simplifié - à adapter selon vraie API)
      console.warn(`[${this.name}] Provider non implémenté - placeholder`);
      
      return {
        indexed: false,
        mentions: 0,
        confidence: 'none',
        metadata: { error: 'Provider non implémenté (Corée)' },
      };

    } catch (error) {
      console.error(`[${this.name}] Erreur:`, error);
      return {
        indexed: false,
        mentions: 0,
        confidence: 'none',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}
