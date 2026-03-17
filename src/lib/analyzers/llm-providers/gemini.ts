/**
 * Google Gemini Provider
 * 
 * Test indexation via Gemini API (Google AI Studio)
 * Gemini a accès au Google Search index complet - concurrent direct de ChatGPT
 */

import { LLMProvider, LLMTestResult, hasAPIKey } from './registry';

export class GeminiProvider implements LLMProvider {
  id = 'gemini';
  name = 'Gemini';
  company = 'Google';
  defaultEnabled = false; // Nécessite GEMINI_API_KEY
  apiKeyEnvVar = 'GEMINI_API_KEY';
  enableEnvVar = 'ENABLE_GEMINI_INDEXATION';
  docsUrl = 'https://ai.google.dev/docs';
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
      // Gemini API REST
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Recherche des informations récentes sur l'entreprise "${brandName}" (site web: ${domain}). Que peux-tu me dire sur cette entreprise ?`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 500,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const answer = data.candidates[0]?.content?.parts[0]?.text?.toLowerCase() || '';

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
