/**
 * Hugging Face Inference API Service
 * Free tier: 30,000 requests/month
 * Use for zero-shot classification and named entity recognition
 */

export interface HFClassification {
  sequence: string;
  labels: string[];
  scores: number[];
}

export interface HFTokenClassification {
  entity_group: string;
  score: number;
  word: string;
  start: number;
  end: number;
}

export interface ExtractedInfoHF {
  intent: string;
  confidence: number;
  entities: {
    names?: string[];
    services?: string[];
    dates?: string[];
    [key: string]: any;
  };
}

export class HuggingFaceService {
  private apiToken: string;
  private baseUrl: string = 'https://api-inference.huggingface.co/models';
  private classificationModel: string = 'facebook/zero-shot-classification';
  private nerModel: string = 'dbmdz/bert-large-cased-finetuned-conll03-english';

  constructor(apiToken?: string) {
    this.apiToken = apiToken || process.env.NEXT_PUBLIC_HF_API_TOKEN || '';
    if (!this.apiToken) {
      console.warn('Hugging Face token not configured - service will not be available');
    }
  }

  /**
   * Classify intent using zero-shot classification
   */
  async classifyIntent(text: string): Promise<HFClassification | null> {
    if (!this.apiToken) {
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/facebook/zero-shot-classification`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: text,
            parameters: {
              candidate_labels: [
                'add employee',
                'mark leave',
                'reassign appointments',
                'get revenue',
                'get analytics',
                'general inquiry'
              ],
              multi_class: false
            }
          }),
          cache: 'no-store'
        }
      );

      if (!response.ok) {
        console.error(`HF Classification error: ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('HF classification error:', error);
      return null;
    }
  }

  /**
   * Extract named entities from text
   */
  async extractEntities(text: string): Promise<HFTokenClassification[] | null> {
    if (!this.apiToken) {
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/dbmdz/bert-large-cased-finetuned-conll03-english`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: text
          }),
          cache: 'no-store'
        }
      );

      if (!response.ok) {
        console.error(`HF NER error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return Array.isArray(data) ? data : null;
    } catch (error) {
      console.error('HF NER error:', error);
      return null;
    }
  }

  /**
   * Parse message using Hugging Face models
   */
  async parseMessage(text: string): Promise<ExtractedInfoHF | null> {
    if (!this.apiToken) {
      return null;
    }

    try {
      // Run classification and NER in parallel
      const [classificationResult, entitiesResult] = await Promise.all([
        this.classifyIntent(text),
        this.extractEntities(text)
      ]);

      if (!classificationResult && !entitiesResult) {
        return null;
      }

      return {
        intent: classificationResult?.labels?.[0] || 'unknown',
        confidence: classificationResult?.scores?.[0] || 0,
        entities: {
          names: this.extractNames(entitiesResult),
          services: this.extractServices(entitiesResult),
          dates: this.extractDates(entitiesResult),
          raw: entitiesResult || []
        }
      };
    } catch (error) {
      console.error('HF parse error:', error);
      return null;
    }
  }

  /**
   * Extract person names from entities
   */
  private extractNames(entities: HFTokenClassification[] | null): string[] {
    if (!entities) return [];

    const names = entities
      .filter(e => e.entity_group === 'PER' || e.entity_group === 'PERSON')
      .map(e => e.word.replace(/^##/, ''))
      .filter((v, i, a) => a.indexOf(v) === i); // unique

    return names;
  }

  /**
   * Extract service mentions from entities
   */
  private extractServices(entities: HFTokenClassification[] | null): string[] {
    if (!entities) return [];

    // Services are usually ORG or misc entities in salon context
    const services = entities
      .filter(e => e.entity_group === 'ORG' || e.entity_group === 'MISC')
      .map(e => e.word.replace(/^##/, ''))
      .filter((v, i, a) => a.indexOf(v) === i);

    return services;
  }

  /**
   * Extract dates from entities
   */
  private extractDates(entities: HFTokenClassification[] | null): string[] {
    if (!entities) return [];

    const dates = entities
      .filter(e => e.entity_group === 'DATE' || e.entity_group === 'TIME')
      .map(e => e.word.replace(/^##/, ''))
      .filter((v, i, a) => a.indexOf(v) === i);

    return dates;
  }

  /**
   * Check if API is available
   */
  isAvailable(): boolean {
    return !!this.apiToken;
  }
}
