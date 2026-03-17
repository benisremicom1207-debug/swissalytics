/**
 * Qwen Provider (Alibaba Cloud)
 * 
 * Test indexation via Qwen 2.5 (modèles open-source avec capabilities web)
 */

import { LLMProvider, LLMTestResult, hasAPIKey } from './registry';

export class QwenProvider implements LLMProvider {
  id = 'qwen';
  name = 'Qwen 2.5';
  company = 'Alibaba Cloud';
  defaultEnabled = false; // Nécessite QWEN_API_KEY
  apiKeyEnvVar = 'QWEN_API_KEY';
  enableEnvVar = 'ENABLE_QWEN_INDEXATION';
  docsUrl = 'https://help.aliyun.com/zh/dashscope/';
  icon = '☁️';

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
      // Alibaba DashScope API
      const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'qwen-plus',
          input: {
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
          },
          parameters: {
            enable_search: true, // Active la recherche web
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Qwen API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const answer = data.output?.text?.toLowerCase() || '';

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
          sources: data.output?.search_results || [],
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
