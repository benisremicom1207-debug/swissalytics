/**
 * ChatGPT Provider (OpenAI)
 * 
 * Test indexation via ChatGPT Search (nécessite GPT-4o avec web search)
 */

import { LLMProvider, LLMTestResult, hasAPIKey } from './registry';

export class ChatGPTProvider implements LLMProvider {
  id = 'chatgpt';
  name = 'ChatGPT';
  company = 'OpenAI';
  defaultEnabled = false; // Nécessite OPENAI_API_KEY
  apiKeyEnvVar = 'OPENAI_API_KEY';
  enableEnvVar = 'ENABLE_CHATGPT_INDEXATION';
  docsUrl = 'https://platform.openai.com/docs/api-reference';
  icon = '🤖';

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
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant with web search capabilities.',
            },
            {
              role: 'user',
              content: `Recherche des informations sur l'entreprise "${brandName}" (site web: ${domain}). Que peux-tu me dire sur cette entreprise ?`,
            },
          ],
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
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
