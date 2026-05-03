/**
 * Bing Copilot Provider (Microsoft)
 * 
 * Test indexation via Bing Search API (proxy pour Copilot/ChatGPT-4 dans Bing)
 */

import { LLMProvider, LLMTestResult, hasAPIKey } from './registry';

export class BingCopilotProvider implements LLMProvider {
  id = 'bing-copilot';
  name = 'Bing Copilot';
  company = 'Microsoft';
  defaultEnabled = false; // Nécessite BING_SEARCH_API_KEY
  apiKeyEnvVar = 'BING_SEARCH_API_KEY';
  enableEnvVar = 'ENABLE_BING_COPILOT_INDEXATION';
  docsUrl = 'https://www.microsoft.com/en-us/bing/apis/bing-web-search-api';
  icon = '🔷';

  isEnabled(): boolean {
    // Activé si clé API configurée
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
      // Bing Search API v7 (proxy pour indexation Copilot)
      const response = await fetch(
        `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(brandName + ' ' + domain)}&count=10`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Bing API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const results = data.webPages?.value || [];

      // Analyser les résultats
      const domainInResults = results.some((r: any) => r.url?.includes(domain));
      const mentions = results.filter((r: any) => 
        r.url?.includes(domain) || r.name?.toLowerCase().includes(brandName.toLowerCase())
      ).length;

      const indexed = domainInResults;
      let confidence: 'high' | 'medium' | 'low' | 'none' = 'none';

      if (indexed) {
        if (mentions >= 3) {
          confidence = 'high';
        } else if (mentions >= 1) {
          confidence = 'medium';
        } else {
          confidence = 'low';
        }
      }

      return {
        indexed,
        mentions,
        confidence,
        metadata: {
          sources: results.slice(0, 3).map((r: any) => r.url),
          responseTime: Date.now(),
        },
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
