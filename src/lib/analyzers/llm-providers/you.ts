/**
 * You.com Provider
 * 
 * Test indexation via You.com API (moteur de recherche IA avec sources)
 */

import { LLMProvider, LLMTestResult, hasAPIKey } from './registry';

export class YouProvider implements LLMProvider {
  id = 'you';
  name = 'You.com';
  company = 'You.com';
  defaultEnabled = false; // Nécessite YOU_API_KEY
  apiKeyEnvVar = 'YOU_API_KEY';
  enableEnvVar = 'ENABLE_YOU_INDEXATION';
  docsUrl = 'https://documentation.you.com/';
  icon = '🌐';

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
      // You.com Chat API
      const response = await fetch('https://api.you.com/smart/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          query: `Informations sur l'entreprise ${brandName} site ${domain}`,
          num_web_results: 10,
        }),
      });

      if (!response.ok) {
        throw new Error(`You.com API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const answer = data.answer?.toLowerCase() || '';
      const webResults = data.web_results || [];

      // Analyser la réponse
      const domainMentioned = answer.includes(domain.toLowerCase()) || 
                              webResults.some((r: any) => r.url?.includes(domain));
      const brandMentioned = answer.includes(brandName.toLowerCase());

      let indexed = false;
      let mentions = 0;
      let confidence: 'high' | 'medium' | 'low' | 'none' = 'none';

      if (domainMentioned || brandMentioned) {
        indexed = true;
        mentions = (answer.match(new RegExp(brandName, 'gi')) || []).length;

        if (domainMentioned && mentions >= 2) {
          confidence = 'high';
        } else if (domainMentioned || mentions >= 1) {
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
          sources: webResults.slice(0, 3).map((r: any) => r.url),
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
