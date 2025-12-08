/**
 * AI-powered Intent Recognition with Conversational Support
 * Hybrid approach: Wit.ai → Hugging Face → Pattern Matching
 * Handles flexible phrasings from admins with multi-turn conversations
 */

import { UnifiedAIService } from './unifiedAIService';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actionData?: AdminAction;
  followUpQuestions?: string[];
}

export interface AdminAction {
  type: 'ADD_EMPLOYEE' | 'EMPLOYEE_LEAVE' | 'REASSIGN_APPOINTMENTS' | 'GET_REVENUE' | 'GET_ANALYTICS' | 'NONE';
  data: Record<string, any>;
  requiresFollowUp: boolean;
  followUpQuestion?: string;
  confidence: number; // 0-1, how confident we are in this intent
}

export interface ExtractedData {
  names: string[];
  categories: string[];
  dates: string[];
  dateType?: string; // 'today', 'yesterday', 'week', 'month'
  action?: string;
  email?: string;
  phone?: string;
}

export interface ConversationContext {
  intent: string;
  extractedData: ExtractedData;
  currentQuestionIndex: number;
}

/**
 * Intent patterns for conversational command matching
 * Handles multiple phrasings of the same intent
 */
const INTENT_PATTERNS = {
  ADD_EMPLOYEE: [
    // "Add new stylist Rahul", "Create employee John"
    /(?:add|create|register|new|hire)\s+(?:new\s+)?(?:stylist|employee|staff|beautician|makeup\s+artist)/i,
    // "Rahul is joining today"
    /(?:is\s+)?(?:joining|starting|beginning|coming)\s+(?:today|tomorrow|this\s+week)/i,
    // "Onboard new staff"
    /(?:onboard|add|register)\s+(?:new\s+)?(?:staff|employee|team\s+member)/i
  ],

  EMPLOYEE_LEAVE: [
    // "Rahul is on leave today"
    /(?:is\s+)?on\s+leave|take\s+leave|day\s+off|unavailable/i,
    // "Mark John unavailable"
    /mark\s+(?:as\s+)?(?:unavailable|offline|out|absent)/i,
    // "Rahul won't be working"
    /(?:won't|will\s+not)\s+(?:be\s+)?(?:working|available|coming)/i,
    // "Sick leave", "vacation", "off"
    /(?:sick|medical|emergency)\s+leave|vacation|going\s+off/i
  ],

  REASSIGN_APPOINTMENTS: [
    // "Reassign his appointments to Priya"
    /(?:reassign|transfer|move|shift|reassign|delegate)\s+(?:his|her|their|the)\s+(?:appointments|bookings|clients|sessions)/i,
    // "Move Rahul's clients to someone else"
    /move\s+(?:rahul|john|[a-z]+)'?s?\s+(?:clients|appointments|bookings)/i,
    // "Handle his appointments", "Cover for Rahul"
    /(?:cover|handle|take)\s+(?:his|her|their)\s+(?:appointments|appointments|workload)/i,
    // "Who can take his bookings?"
    /who\s+(?:can|should)\s+(?:take|handle|cover)\s+(?:his|her|their)\s+(?:appointments|bookings)/i
  ],

  GET_REVENUE: [
    // "What was my revenue yesterday?"
    /(?:what\s+(?:was|is)|show\s+me|tell\s+me|give\s+me)\s+(?:my\s+)?revenue|earnings|income/i,
    // "Revenue for yesterday"
    /revenue\s+(?:for\s+)?(?:today|yesterday|this\s+week|this\s+month|last\s+month)/i,
    // "How much did we earn?"
    /how\s+(?:much|many).*?(?:earn|made|revenue|income)/i,
    // "Daily earnings", "Weekly income"
    /(?:daily|weekly|monthly)\s+(?:earnings|income|revenue)/i,
    // "Sales figures", "Profit"
    /(?:sales|profit|total)\s+(?:figures|today|this\s+week)/i
  ],

  GET_ANALYTICS: [
    // "How many bookings do I have?"
    /(?:how\s+many|show|what|tell)\s+(?:bookings|appointments|clients|employees)/i,
    // "Analytics", "Dashboard stats", "Metrics"
    /analytics|dashboard|statistics|metrics|overview/i,
    // "Employee status", "who is available"
    /(?:who|which)\s+(?:employees?|stylists?|staff)\s+(?:is|are)\s+(?:available|working|on\s+leave)/i,
    // "Busy today?", "Schedule overview"
    /(?:busy|schedule|workload)\s+(?:today|overview)/i
  ]
};

/**
 * Question patterns to guide follow-ups
 */
const FOLLOW_UP_QUESTIONS = {
  ADD_EMPLOYEE: [
    { question: "What's their full name?", field: 'names', type: 'name' },
    { question: "What specialties can they work with? (e.g., Hair Styling, Coloring, Makeup)", field: 'categories', type: 'categories' },
    { question: "What's their email address?", field: 'email', type: 'email' },
    { question: "What's their phone number?", field: 'phone', type: 'phone' }
  ],

  EMPLOYEE_LEAVE: [
    { question: "Which employee are you referring to?", field: 'names', type: 'name' },
    { question: "When does the leave start?", field: 'dateStart', type: 'date' },
    { question: "When does the leave end?", field: 'dateEnd', type: 'date' }
  ],

  REASSIGN_APPOINTMENTS: [
    { question: "Which employee's appointments should we reassign?", field: 'fromEmployee', type: 'name' },
    { question: "Who should we reassign them to?", field: 'toEmployee', type: 'name' }
  ],

  GET_REVENUE: [
    { question: "Which period would you like to check? (today, yesterday, this week, this month)", field: 'dateType', type: 'dateType' }
  ],

  GET_ANALYTICS: [
    { question: "What analytics would you like to see?", field: 'analyticsType', type: 'text' }
  ]
};

/**
 * Name extraction from various contexts
 */
const extractNames = (text: string): string[] => {
  const names: string[] = [];

  // Extract capitalized words (likely names)
  const capitalized = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g) || [];
  names.push(...capitalized);

  // Common patterns: "name is X", "X is", "employee X"
  const patterns = [
    /(?:name\s+is|called|named)\s+([A-Z][a-z]+)/i,
    /(?:employee|stylist|staff|beautician)\s+([A-Z][a-z]+)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      names.push(match[1]);
    }
  }

  return [...new Set(names)]; // Remove duplicates
};

/**
 * Email extraction
 */
const extractEmail = (text: string): string | null => {
  const emailPattern = /([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
  const match = text.match(emailPattern);
  return match ? match[1].toLowerCase() : null;
};

/**
 * Phone extraction - Flexible format support
 */
const extractPhone = (text: string): string | null => {
  // Try multiple phone formats: (XXX) XXX-XXXX, XXX-XXX-XXXX, XXX.XXX.XXXX, XXXXXXXXXX
  const patterns = [
    /\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})/, // US format
    /([0-9]{10})/, // 10 digits
    /\+([0-9]{1,3})[\s.-]?([0-9]{6,})/  // International
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match.length === 4) {
        return `${match[1]}-${match[2]}-${match[3]}`;
      } else if (match.length === 2 && match[1].length === 10) {
        const phone = match[1];
        return `${phone.substring(0, 3)}-${phone.substring(3, 6)}-${phone.substring(6)}`;
      } else if (match.length >= 2) {
        return match[0].replace(/\s/g, '');
      }
    }
  }
  return null;
};

/**
 * Enhanced category extraction - handles more variations
 */
const extractCategories = (text: string): string[] => {
  // Expanded list with variations
  const categoryPatterns: { [key: string]: RegExp } = {
    'Hair Styling': /hair\s+(?:styling|style|cut|cutting)|styling|haircut/i,
    'Coloring': /coloring|color|highlights|dye|dyeing|hue|tint|tinting/i,
    'Makeup': /makeup|make-up|face\s+makeup|bridal\s+makeup|cosmetics/i,
    'Cutting': /cutting|cut|trim|trimming|fade/i,
    'Treatments': /treatments?|treatment\s+(?:services?|therapy)|spa|deep\s+conditioning/i,
    'Bridal': /bridal|bride|wedding|engagement/i,
    'Facial': /facial|facials|face\s+care|skincare|face\s+treatment/i,
    'Massage': /massage|body\s+massage|therapeutic|relaxation/i,
    'Nails': /nail|nails|manicure|pedicure|nail\s+art/i,
    'Threading': /threading|thread/i,
    'Blow Dry': /blow\s+(?:dry|dryer)|blow\s+out/i,
    'Straightening': /straightening|straight|keratin|brazilian\s+treatment/i,
    'Extensions': /extensions?|hair\s+extension|lash\s+extension/i,
    'Perming': /perming?|perm|permanent\s+wave/i,
    'Keratin': /keratin|keratin\s+treatment/i
  };

  const found: string[] = [];

  for (const [category, pattern] of Object.entries(categoryPatterns)) {
    if (pattern.test(text)) {
      found.push(category);
    }
  }

  return [...new Set(found)]; // Remove duplicates
};

/**
 * Date extraction
 */
const extractDateType = (text: string): string | null => {
  const datePatterns = {
    today: /today/i,
    yesterday: /yesterday/i,
    week: /this\s+week|weekly/i,
    month: /this\s+month|monthly/i,
    'last month': /last\s+month/i
  };

  for (const [dateType, pattern] of Object.entries(datePatterns)) {
    if (pattern.test(text)) {
      return dateType;
    }
  }
  return null;
};

/**
 * Main Service Class with conversation context
 */
export class AdminChatService {
  private conversationHistory: Array<{ role: string; content: string }> = [];
  private conversationContext: ConversationContext | null = null;
  private unifiedAI: UnifiedAIService;
  private useAIFallback: boolean = true;

  constructor(useAIFallback: boolean = true, witaiToken?: string, hfToken?: string) {
    this.useAIFallback = useAIFallback;
    this.unifiedAI = new UnifiedAIService(witaiToken, hfToken);
  }

  /**
   * Try to match intent using AI service first, fallback to patterns
   */
  private async matchIntentWithAI(text: string): Promise<{ intent: string; confidence: number; aiSource?: string } | null> {
    if (this.useAIFallback) {
      try {
        const aiResult = await this.unifiedAI.analyzeMessage(text);
        
        if (aiResult.source !== 'none' && aiResult.confidence > 0.5) {
          // Map AI intent to our intent types
          const mappedIntent = this.mapAIIntentToAppIntent(aiResult.intent);
          if (mappedIntent) {
            return {
              intent: mappedIntent,
              confidence: aiResult.confidence,
              aiSource: aiResult.source
            };
          }
        }
      } catch (error) {
        console.error('AI service error, falling back to patterns:', error);
      }
    }

    // Fall back to pattern matching
    return this.matchIntentWithPatterns(text);
  }

  /**
   * Match intent using regex patterns
   */
  private matchIntentWithPatterns(text: string): { intent: string; confidence: number } | null {
    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
      for (const pattern of patterns as RegExp[]) {
        if (pattern.test(text)) {
          // Multiple pattern matches increase confidence
          const matchCount = (patterns as RegExp[]).filter(p => p.test(text)).length;
          const confidence = Math.min(1, 0.5 + matchCount * 0.25);
          return { intent, confidence };
        }
      }
    }

    return null;
  }

  /**
   * Map AI service intents to our app intents
   */
  private mapAIIntentToAppIntent(aiIntent: string): string | null {
    const intentMap: { [key: string]: string } = {
      'add employee': 'ADD_EMPLOYEE',
      'create employee': 'ADD_EMPLOYEE',
      'new employee': 'ADD_EMPLOYEE',
      'hire employee': 'ADD_EMPLOYEE',
      'add staff': 'ADD_EMPLOYEE',
      'onboard': 'ADD_EMPLOYEE',
      'mark leave': 'EMPLOYEE_LEAVE',
      'take leave': 'EMPLOYEE_LEAVE',
      'employee leave': 'EMPLOYEE_LEAVE',
      'day off': 'EMPLOYEE_LEAVE',
      'unavailable': 'EMPLOYEE_LEAVE',
      'reassign appointments': 'REASSIGN_APPOINTMENTS',
      'transfer appointments': 'REASSIGN_APPOINTMENTS',
      'move appointments': 'REASSIGN_APPOINTMENTS',
      'reassign': 'REASSIGN_APPOINTMENTS',
      'get revenue': 'GET_REVENUE',
      'revenue': 'GET_REVENUE',
      'earnings': 'GET_REVENUE',
      'income': 'GET_REVENUE',
      'sales': 'GET_REVENUE',
      'get analytics': 'GET_ANALYTICS',
      'analytics': 'GET_ANALYTICS',
      'dashboard': 'GET_ANALYTICS',
      'statistics': 'GET_ANALYTICS',
      'metrics': 'GET_ANALYTICS',
      'general inquiry': 'NONE'
    };

    const normalized = aiIntent.toLowerCase().trim();
    return intentMap[normalized] || null;
  }

  /**
   * Extract structured data with AI fallback
   */
  private async extractDataWithAI(text: string, intent: string): Promise<ExtractedData> {
    const data: ExtractedData = {
      names: [],
      categories: [],
      dates: [],
      dateType: undefined
    };

    try {
      // Try AI extraction first if available
      if (this.useAIFallback) {
        const aiEntities = await this.unifiedAI.extractEntities(text);
        if (aiEntities && (aiEntities.names?.length || aiEntities.services?.length || aiEntities.dates?.length)) {
          data.names = aiEntities.names || [];
          data.categories = aiEntities.services || [];
          data.dates = aiEntities.dates || [];
        }
      }
    } catch (error) {
      console.error('AI extraction error:', error);
    }

    // Merge with pattern-based extraction
    const patternData = this.extractData(text, intent);
    
    // Use AI results if available, otherwise use pattern results
    data.names = data.names.length > 0 ? data.names : patternData.names;
    data.categories = data.categories.length > 0 ? data.categories : patternData.categories;
    data.dates = data.dates.length > 0 ? data.dates : patternData.dates;
    data.dateType = patternData.dateType;
    data.email = patternData.email;
    data.phone = patternData.phone;

    return data;
  }

  /**
   * Extract structured data from message (pattern-based fallback)
   */
  private extractData(text: string, intent: string): ExtractedData {
    const dateTypeValue = extractDateType(text);
    const data: ExtractedData = {
      names: extractNames(text),
      categories: extractCategories(text),
      dates: [],
      dateType: dateTypeValue || undefined
    };

    // Try to extract email and phone
    const email = extractEmail(text);
    const phone = extractPhone(text);

    if (email) data.email = email;
    if (phone) data.phone = phone;

    return data;
  }

  /**
   * Determine which follow-up questions are needed
   */
  private getRequiredFollowUps(intent: string, extractedData: ExtractedData): any[] {
    const questions = FOLLOW_UP_QUESTIONS[intent as keyof typeof FOLLOW_UP_QUESTIONS] || [];
    const needed: any[] = [];

    switch (intent) {
      case 'ADD_EMPLOYEE': {
        // ADD ALL missing follow-ups in the correct order
        if (extractedData.names.length === 0) needed.push(questions[0]); // Name (index 0)
        if (extractedData.categories.length === 0) needed.push(questions[1]); // Specialties (index 1)
        if (!extractedData.email) needed.push(questions[2]); // Email (index 2)
        if (!extractedData.phone) needed.push(questions[3]); // Phone (index 3)
        break;
      }

      case 'EMPLOYEE_LEAVE': {
        if (extractedData.names.length === 0) needed.push(questions[0]); // Which employee
        if (!extractedData.dateType) {
          needed.push(questions[1]); // When starts
          needed.push(questions[2]); // When ends
        }
        break;
      }

      case 'REASSIGN_APPOINTMENTS': {
        if (extractedData.names.length < 2) needed.push(questions[0]); // Which employee
        if (extractedData.names.length < 2) needed.push(questions[1]); // Reassign to whom
        break;
      }

      case 'GET_REVENUE': {
        if (!extractedData.dateType) needed.push(questions[0]); // Which period
        break;
      }
    }

    return needed;
  }

  /**
   * Generate conversational response based on context
   */
  private generateResponse(intent: string, extractedData: ExtractedData, neededFollowUps: any[]): string {
    if (neededFollowUps.length > 0) {
      // Ask for missing information
      const names = extractedData.names.length > 0 ? extractedData.names[0] : '';
      
      let response = '';
      if (intent === 'ADD_EMPLOYEE' && extractedData.names.length > 0) {
        response = `Great! I'm adding ${names} to the system. `;
      } else if (intent === 'EMPLOYEE_LEAVE' && extractedData.names.length > 0) {
        response = `Noted that ${names} is on leave. `;
      } else if (intent === 'REASSIGN_APPOINTMENTS' && extractedData.names.length > 0) {
        response = `I'll help reassign ${names}'s appointments. `;
      }

      response += neededFollowUps[0].question;
      return response;
    }

    // Generate completion response
    const names = extractedData.names.join(' and ');
    const specialties = extractedData.categories.length > 0 ? extractedData.categories.join(', ') : '';
    
    switch (intent) {
      case 'ADD_EMPLOYEE':
        let addMsg = `Perfect! I'm ready to add ${names}`;
        if (specialties) addMsg += ` (Specialties: ${specialties})`;
        addMsg += ' to the system. Let me save this to the database...';
        return addMsg;

      case 'EMPLOYEE_LEAVE':
        return `Understood. ${names} is marked as on leave. I'm checking their appointments...`;

      case 'REASSIGN_APPOINTMENTS':
        return `Got it! I'll reassign the appointments now...`;

      case 'GET_REVENUE':
        const period = extractedData.dateType || 'the requested period';
        return `Let me fetch the revenue data for ${period}...`;

      case 'GET_ANALYTICS':
        return `Pulling up your analytics dashboard...`;

      default:
        return 'Processing your request...';
    }
  }

  /**
   * Main message processing function with context awareness
   */
  async processMessage(userMessage: string): Promise<ChatMessage> {
    try {
      this.conversationHistory.push({
        role: 'user',
        content: userMessage
      });

      // Step 1: Check if we're in a conversation context (following up)
      if (this.conversationContext) {
        // We're responding to a previous question, continue in that context
        const intent = this.conversationContext.intent;
        const currentQuestion = FOLLOW_UP_QUESTIONS[intent as keyof typeof FOLLOW_UP_QUESTIONS]?.[
          this.conversationContext.currentQuestionIndex
        ];

        if (currentQuestion) {
          // Extract data relevant to the current question
          const fieldType = currentQuestion.type;
          
          if (fieldType === 'categories') {
            // Extract specialties/categories from follow-up response
            const categories = extractCategories(userMessage);
            if (categories.length > 0) {
              this.conversationContext.extractedData.categories.push(...categories);
            } else {
              // Try to parse comma-separated services
              const parts = userMessage.split(',').map(p => p.trim());
              for (const part of parts) {
                const extracted = extractCategories(part);
                if (extracted.length > 0) {
                  this.conversationContext.extractedData.categories.push(...extracted);
                }
              }
            }
          } else if (fieldType === 'name') {
            const names = extractNames(userMessage);
            if (names.length > 0) {
              this.conversationContext.extractedData.names.push(...names);
            }
          } else if (fieldType === 'email') {
            const email = extractEmail(userMessage);
            if (email) {
              this.conversationContext.extractedData.email = email;
              console.log('[AdminChat] Email extracted:', email);
            } else {
              console.log('[AdminChat] No email found in:', userMessage);
            }
          } else if (fieldType === 'phone') {
            const phone = extractPhone(userMessage);
            if (phone) {
              this.conversationContext.extractedData.phone = phone;
              console.log('[AdminChat] Phone extracted:', phone);
            } else {
              console.log('[AdminChat] No phone found in:', userMessage);
            }
          } else if (fieldType === 'dateType') {
            const dateType = extractDateType(userMessage);
            if (dateType) {
              this.conversationContext.extractedData.dateType = dateType;
            }
          }

          // Move to next question or complete
          this.conversationContext.currentQuestionIndex++;

          // Check if we still need more questions
          const neededFollowUps = this.getRequiredFollowUps(
            intent,
            this.conversationContext.extractedData
          );

          const response = this.generateResponse(
            intent,
            this.conversationContext.extractedData,
            neededFollowUps.slice(this.conversationContext.currentQuestionIndex)
          );

          this.conversationHistory.push({
            role: 'assistant',
            content: response
          });

          // If no more follow-ups needed, clear context
          if (neededFollowUps.length <= this.conversationContext.currentQuestionIndex) {
            console.log('[AdminChat] All follow-ups complete. Final data:', this.conversationContext.extractedData);
            const actionData: AdminAction = {
              type: intent as any,
              data: this.conversationContext.extractedData,
              requiresFollowUp: false,
              confidence: 0.9
            };
            console.log('[AdminChat] Returning action to API:', actionData);
            this.conversationContext = null;

            return {
              id: Date.now().toString(),
              role: 'assistant',
              content: response,
              timestamp: new Date(),
              actionData,
              followUpQuestions: []
            };
          }

          // Still have follow-ups
          const nextQuestions = neededFollowUps
            .slice(this.conversationContext.currentQuestionIndex)
            .map(q => q.question);

          return {
            id: Date.now().toString(),
            role: 'assistant',
            content: response,
            timestamp: new Date(),
            actionData: {
              type: intent as any,
              data: this.conversationContext.extractedData,
              requiresFollowUp: true,
              followUpQuestion: nextQuestions[0],
              confidence: 0.8
            },
            followUpQuestions: nextQuestions
          };
        }
      }

      // Step 2: Try to match a new intent (AI first, then patterns)
      const intentMatch = await this.matchIntentWithAI(userMessage);

      if (intentMatch && intentMatch.confidence > 0.4) {
        // Intent matched (either AI or pattern)
        const extractedData = await this.extractDataWithAI(userMessage, intentMatch.intent);
        const neededFollowUps = this.getRequiredFollowUps(intentMatch.intent, extractedData);

        // If follow-ups are needed, store context
        if (neededFollowUps.length > 0) {
          this.conversationContext = {
            intent: intentMatch.intent,
            extractedData,
            currentQuestionIndex: 0
          };
        }

        const response = this.generateResponse(intentMatch.intent, extractedData, neededFollowUps);

        const actionData: AdminAction = {
          type: intentMatch.intent as any,
          data: extractedData,
          requiresFollowUp: neededFollowUps.length > 0,
          followUpQuestion: neededFollowUps[0]?.question,
          confidence: intentMatch.confidence
        };

        this.conversationHistory.push({
          role: 'assistant',
          content: response
        });

        const followUpQuestions = neededFollowUps.map(q => q.question);

        return {
          id: Date.now().toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date(),
          actionData,
          followUpQuestions
        };
      }

      // Step 3: Generic response if no match
      const genericResponse =
        "I didn't quite understand that. Try commands like:\n" +
        "• \"Add new stylist Rahul\"\n" +
        "• \"Mark John on leave\"\n" +
        "• \"Reassign his appointments to Priya\"\n" +
        "• \"What was my revenue yesterday?\"\n" +
        "• \"Show me analytics\"";

      this.conversationHistory.push({
        role: 'assistant',
        content: genericResponse
      });

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: genericResponse,
        timestamp: new Date(),
        actionData: {
          type: 'NONE',
          data: {},
          requiresFollowUp: false,
          confidence: 0
        }
      };
    } catch (error) {
      console.error('Error in admin chat:', error);
      throw error;
    }
  }

  clearHistory(): void {
    this.conversationHistory = [];
    this.conversationContext = null;
  }

  getConversationHistory(): Array<{ role: string; content: string }> {
    return this.conversationHistory;
  }
}
