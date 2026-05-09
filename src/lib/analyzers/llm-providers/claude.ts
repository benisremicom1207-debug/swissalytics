/**
 * Claude Provider (Anthropic)
 *
 * Test indexation via l'API Messages d'Anthropic. Modèle : claude-haiku-4-5,
 * le plus rapide et le moins cher d'Anthropic — équivalent en coût/qualité à
 * gpt-4o-mini pour la tâche de reconnaissance de marque.
 *
 * Différences notables vs OpenAI :
 *   - Auth via header `x-api-key`, PAS `Authorization: Bearer`
 *   - Header `anthropic-version` obligatoire
 *   - Body : `{ model, messages, max_tokens, system }` (system est top-level, pas un message)
 *   - Réponse : `data.content[0].text` (pas `data.choices[0].message.content`)
 */

import { LLMProvider, LLMTestResult, hasAPIKey } from './registry';

export class ClaudeProvider implements LLMProvider {
  id = 'claude';
  name = 'Claude';
  company = 'Anthropic';
  defaultEnabled = false; // Nécessite ANTHROPIC_API_KEY
  apiKeyEnvVar = 'ANTHROPIC_API_KEY';
  enableEnvVar = 'ENABLE_CLAUDE_INDEXATION';
  docsUrl = 'https://docs.anthropic.com/';
  icon = '🟣';

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
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          // claude-haiku-4-5 : le moins cher d'Anthropic (~$1/1M input tk),
          // équivalent fonctionnel à gpt-4o-mini pour la reconnaissance de marque.
          // $5 de crédit ≈ 25 000 analyses.
          model: 'claude-haiku-4-5',
          max_tokens: 500,
          system: 'You are a helpful assistant with web search capabilities.',
          messages: [
            {
              role: 'user',
              content: `Recherche des informations sur l'entreprise "${brandName}" (site web: ${domain}). Que peux-tu me dire sur cette entreprise ?`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const answer: string = (data.content?.[0]?.text || '').toLowerCase();

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
