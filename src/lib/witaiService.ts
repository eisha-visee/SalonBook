/**
 * Wit.ai NLP Service
 * Free tier: 10,000 requests/month
 * Excellent for intent recognition and entity extraction
 */

export interface WitIntent {
  id: string;
  name: string;
  confidence: number;
}

export interface WitEntity {
  id: string;
  name: string;
  role: string;
  start: number;
  end: number;
  body: string;
  confidence: number;
  entities: WitEntity[];
}

export interface WitResponse {
  text: string;
  intents: WitIntent[];
  entities: Record<string, WitEntity[]>;
  traits: Record<string, any[]>;
}

export interface ExtractedInfo {
  intent: string;
  confidence: number;
  entities: {
    names?: string[];
    dates?: string[];
    services?: string[];
    [key: string]: any;
  };
}

export class WitaiService {
  private apiToken: string;
  private apiVersion: string = '20240101';
  private baseUrl: string = 'https://api.wit.ai';

  constructor(apiToken?: string) {
    this.apiToken = apiToken || process.env.NEXT_PUBLIC_WIT_AI_TOKEN || '';
    if (!this.apiToken) {
      console.warn('Wit.ai token not configured - service will not be available');
    }
  }

  /**
   * Parse user message using Wit.ai
   */
  async parseMessage(message: string): Promise<ExtractedInfo | null> {
    if (!this.apiToken) {
      return null;
    }

    try {
      const searchParams = new URLSearchParams({
        v: this.apiVersion,
        text: message
      });

      const response = await fetch(`${this.baseUrl}/parse?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Accept': 'application/json'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        console.error(`Wit.ai error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data: WitResponse = await response.json();
      return this.extractInfo(data);
    } catch (error) {
      console.error('Wit.ai parse error:', error);
      return null;
    }
  }

  /**
   * Converse with Wit.ai (multi-turn support)
   */
  async converse(
    message: string,
    sessionId: string,
    context?: Record<string, any>
  ): Promise<ExtractedInfo | null> {
    if (!this.apiToken) {
      return null;
    }

    try {
      const searchParams = new URLSearchParams({
        v: this.apiVersion,
        session_id: sessionId,
        text: message
      });

      const response = await fetch(
        `${this.baseUrl}/converse?${searchParams.toString()}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: context ? JSON.stringify(context) : '{}',
          cache: 'no-store'
        }
      );

      if (!response.ok) {
        console.error(`Wit.ai converse error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      return this.extractConverseInfo(data);
    } catch (error) {
      console.error('Wit.ai converse error:', error);
      return null;
    }
  }

  /**
   * Extract structured info from Wit.ai response
   */
  private extractInfo(data: WitResponse): ExtractedInfo {
    const primaryIntent = data.intents?.[0];

    return {
      intent: primaryIntent?.name || 'unknown',
      confidence: primaryIntent?.confidence || 0,
      entities: {
        names: this.extractNames(data.entities),
        dates: this.extractDates(data.entities),
        services: this.extractServices(data.entities),
        raw: data.entities
      }
    };
  }

  /**
   * Extract info from converse endpoint response
   */
  private extractConverseInfo(data: any): ExtractedInfo {
    return {
      intent: data.type || 'unknown',
      confidence: 0.8,
      entities: {
        action: data.action || undefined,
        confidence: data.confidence || undefined,
        entities: data.entities || {}
      }
    };
  }

  /**
   * Extract names from entities
   */
  private extractNames(entities: Record<string, WitEntity[]>): string[] {
    const names: string[] = [];

    // Check common entity types for names
    const nameFields = ['contact', 'wit/person_name', 'person', 'wit/contact:contact'];
    
    for (const field of nameFields) {
      if (entities[field]) {
        entities[field].forEach(entity => {
          names.push(entity.body);
        });
      }
    }

    return [...new Set(names)];
  }

  /**
   * Extract dates from entities
   */
  private extractDates(entities: Record<string, WitEntity[]>): string[] {
    const dates: string[] = [];

    const dateFields = ['wit/datetime', 'wit/local_search_query', 'date'];
    
    for (const field of dateFields) {
      if (entities[field]) {
        entities[field].forEach(entity => {
          dates.push(entity.body);
        });
      }
    }

    return [...new Set(dates)];
  }

  /**
   * Extract service/product mentions from entities
   */
  private extractServices(entities: Record<string, WitEntity[]>): string[] {
    const services: string[] = [];

    const serviceFields = ['service', 'product', 'wit/on_the_rocks', 'wit/cuisine'];
    
    for (const field of serviceFields) {
      if (entities[field]) {
        entities[field].forEach(entity => {
          services.push(entity.body);
        });
      }
    }

    return [...new Set(services)];
  }

  /**
   * Check if API is available
   */
  isAvailable(): boolean {
    return !!this.apiToken;
  }
}
