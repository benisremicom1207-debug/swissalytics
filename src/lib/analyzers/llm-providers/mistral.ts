/**
 * Mistral Provider (Mistral AI)
 * 
 * Test indexation via Mistral API (modèles français/européens)
 */

import { LLMProvider, LLMTestResult, hasAPIKey } from './registry';

export class MistralProvider implements LLMProvider {
  id = 'mistral';
  name = 'Mistral AI';
  company = 'Mistral AI';
  defaultEnabled = false; // Nécessite MISTRAL_API_KEY
  apiKeyEnvVar = 'MISTRAL_API_KEY';
  enableEnvVar = 'ENABLE_MISTRAL_INDEXATION';
  docsUrl = 'https://docs.mistral.ai/';
  icon = '🇫🇷';

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
      // Mistral API compatible OpenAI
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant with web search capabilities.',
            },
            {
              role: 'user',
              content: `Recherche des informations sur l'entreprise "${brandName}" (site web: ${domain}). Que peux-tu me dire ?`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Mistral API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const answer = data.choices[0].message.content.toLowerCase();

      // Analyser la réponse
      const domainMentioned = answer.includes(domain.toLowerCase());
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
