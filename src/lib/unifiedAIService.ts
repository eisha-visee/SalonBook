/**
 * Unified AI Service with Fallback Chain
 * Chains multiple free-tier APIs for maximum reliability and efficiency
 * 
 * Fallback Order:
 * 1. Wit.ai - Best for intent recognition (10k/month free)
 * 2. Hugging Face - Good for entity extraction (30k/month free)
 * 3. Local Pattern Matching - Backup for reliability
 */

import { WitaiService } from './witaiService';
import { HuggingFaceService } from './huggingFaceService';

export interface AIResult {
  intent: string;
  confidence: number;
  entities: {
    names?: string[];
    services?: string[];
    dates?: string[];
    [key: string]: any;
  };
  source: 'wit' | 'huggingface' | 'pattern' | 'none';
}

export class UnifiedAIService {
  private witai: WitaiService;
  private huggingface: HuggingFaceService;
  private requestCount: number = 0;
  private startTime: number = Date.now();

  constructor(witaiToken?: string, hfToken?: string) {
    this.witai = new WitaiService(witaiToken);
    this.huggingface = new HuggingFaceService(hfToken);
  }

  /**
   * Main entry point - tries multiple AI services in fallback order
   */
  async analyzeMessage(text: string): Promise<AIResult> {
    this.requestCount++;

    try {
      // Try Wit.ai first (best for intent recognition)
      if (this.witai.isAvailable()) {
        const witResult = await this.witai.parseMessage(text);
        if (witResult && witResult.confidence > 0.6) {
          return {
            intent: witResult.intent,
            confidence: witResult.confidence,
            entities: witResult.entities,
            source: 'wit'
          };
        }
      }

      // Try Hugging Face as fallback
      if (this.huggingface.isAvailable()) {
        const hfResult = await this.huggingface.parseMessage(text);
        if (hfResult && hfResult.confidence > 0.5) {
          return {
            intent: hfResult.intent,
            confidence: hfResult.confidence,
            entities: hfResult.entities,
            source: 'huggingface'
          };
        }
      }

      // If both fail, return none (caller will use pattern matching)
      return {
        intent: 'unknown',
        confidence: 0,
        entities: { names: [], services: [], dates: [] },
        source: 'none'
      };
    } catch (error) {
      console.error('Unified AI service error:', error);
      return {
        intent: 'unknown',
        confidence: 0,
        entities: { names: [], services: [], dates: [] },
        source: 'none'
      };
    }
  }

  /**
   * Extract entities specifically with fallback
   */
  async extractEntities(text: string): Promise<{
    names: string[];
    services: string[];
    dates: string[];
  }> {
    try {
      // Try Hugging Face NER first (better for entity extraction)
      if (this.huggingface.isAvailable()) {
        const entities = await this.huggingface.extractEntities(text);
        if (entities && entities.length > 0) {
          return {
            names: this.extractFromEntities(entities, 'PER'),
            services: this.extractFromEntities(entities, 'ORG'),
            dates: this.extractFromEntities(entities, 'DATE')
          };
        }
      }

      // Try Wit.ai as fallback
      if (this.witai.isAvailable()) {
        const witResult = await this.witai.parseMessage(text);
        if (witResult) {
          return {
            names: witResult.entities.names || [],
            services: witResult.entities.services || [],
            dates: witResult.entities.dates || []
          };
        }
      }

      // Return empty if both fail
      return { names: [], services: [], dates: [] };
    } catch (error) {
      console.error('Entity extraction error:', error);
      return { names: [], services: [], dates: [] };
    }
  }

  /**
   * Helper to extract specific entity types
   */
  private extractFromEntities(entities: any[], type: string): string[] {
    if (!entities) return [];
    return entities
      .filter(e => e.entity_group === type)
      .map(e => e.word?.replace(/^##/, '') || e.word)
      .filter((v, i, a) => v && a.indexOf(v) === i);
  }

  /**
   * Get service health/quota info
   */
  async getServiceStatus(): Promise<{
    witai: boolean;
    huggingface: boolean;
    requestCount: number;
    uptime: number;
  }> {
    return {
      witai: this.witai.isAvailable(),
      huggingface: this.huggingface.isAvailable(),
      requestCount: this.requestCount,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Reset service counter
   */
  resetMetrics(): void {
    this.requestCount = 0;
    this.startTime = Date.now();
  }
}
