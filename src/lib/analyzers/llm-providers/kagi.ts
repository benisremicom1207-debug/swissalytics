/**
 * Kagi Search Provider
 * 
 * Test indexation via Kagi API (moteur de recherche premium avec IA)
 * Très populaire chez les early adopters tech en Suisse
 */

import { LLMProvider, LLMTestResult, hasAPIKey } from './registry';

export class KagiProvider implements LLMProvider {
  id = 'kagi';
  name = 'Kagi';
  company = 'Kagi Inc.';
  defaultEnabled = false; // Nécessite KAGI_API_KEY
  apiKeyEnvVar = 'KAGI_API_KEY';
  enableEnvVar = 'ENABLE_KAGI_INDEXATION';
  docsUrl = 'https://help.kagi.com/kagi/api/overview.html';
  icon = '🔍';

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
      // Kagi FastGPT API (IA avec recherche web)
      const response = await fetch('https://kagi.com/api/v0/fastgpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bot ${apiKey}`,
        },
        body: JSON.stringify({
          query: `Informations sur l'entreprise ${brandName} (${domain})`,
          web_search: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Kagi API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const answer = data.data?.output?.toLowerCase() || '';
      const references = data.data?.references || [];

      // Analyser la réponse
      const domainMentioned = answer.includes(domain.toLowerCase()) ||
                              references.some((r: any) => r.url?.includes(domain));
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
          sources: references.slice(0, 3).map((r: any) => r.url),
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
