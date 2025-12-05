import { GeminiConversation } from './geminiService';
import { OpenAIService } from './openaiService';
import { GroqService } from './groqService';
import { elevenLabsSTT } from './sttServices';
import { assemblyAISTT } from './assemblyaiService';
import { sarvamSTT } from './sarvamService';

export interface ServiceStatus {
    name: string;
    available: boolean;
    lastError?: string;
}

export class MultiServiceManager {
    private gemini: GeminiConversation | null = null;
    private openai: OpenAIService | null = null;
    private groq: GroqService | null = null;
    private currentConversationService: 'gemini' | 'groq' | 'openai' = 'groq';

    private serviceStatus: Map<string, ServiceStatus> = new Map([
        ['whisper', { name: 'OpenAI Whisper', available: true }],
        ['assemblyai', { name: 'AssemblyAI', available: true }],
        ['sarvam-stt', { name: 'Sarvam STT', available: true }],
        ['elevenlabs-stt', { name: 'ElevenLabs STT', available: true }],
        ['groq', { name: 'Groq AI', available: true }],
        ['gemini', { name: 'Gemini AI', available: true }],
        ['openai-gpt', { name: 'OpenAI GPT', available: true }],
    ]);

    constructor() {
        try {
            this.groq = new GroqService();
        } catch (e) {
            console.warn('Groq initialization failed:', e);
            this.markServiceUnavailable('groq', String(e));
        }

        try {
            this.gemini = new GeminiConversation();
        } catch (e) {
            console.warn('Gemini initialization failed:', e);
            this.markServiceUnavailable('gemini', String(e));
        }

        try {
            this.openai = new OpenAIService();
        } catch (e) {
            console.warn('OpenAI initialization failed:', e);
            this.markServiceUnavailable('openai-gpt', String(e));
            this.markServiceUnavailable('whisper', String(e));
        }
    }

    private markServiceUnavailable(service: string, error: string) {
        const status = this.serviceStatus.get(service);
        if (status) {
            status.available = false;
            status.lastError = error;
        }
    }

    private markServiceAvailable(service: string) {
        const status = this.serviceStatus.get(service);
        if (status) {
            status.available = true;
            status.lastError = undefined;
        }
    }

    // Multi-service STT with 4 fallback services
    async transcribeAudio(audioBlob: Blob): Promise<{ text: string; service: string }> {
        const errors: string[] = [];

        // 1. Try OpenAI Whisper (most accurate)
        if (this.serviceStatus.get('whisper')?.available && this.openai) {
            try {
                const text = await this.openai.transcribeAudio(audioBlob);
                this.markServiceAvailable('whisper');
                return { text, service: 'OpenAI Whisper' };
            } catch (error: any) {
                console.warn('Whisper failed:', error);
                errors.push(`Whisper: ${error.message}`);
                if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('429') || error.message.includes('quota')) {
                    this.markServiceUnavailable('whisper', 'Quota exceeded');
                }
            }
        }

        // 2. Try AssemblyAI (very accurate, generous free tier)
        if (this.serviceStatus.get('assemblyai')?.available) {
            try {
                const text = await assemblyAISTT(audioBlob);
                this.markServiceAvailable('assemblyai');
                return { text, service: 'AssemblyAI' };
            } catch (error: any) {
                console.warn('AssemblyAI failed:', error);
                errors.push(`AssemblyAI: ${error.message}`);
                if (error.message.includes('QUOTA_EXCEEDED')) {
                    this.markServiceUnavailable('assemblyai', 'Quota exceeded');
                }
            }
        }

        // 3. Try Sarvam AI (Indian English specialist)
        if (this.serviceStatus.get('sarvam-stt')?.available) {
            try {
                const text = await sarvamSTT(audioBlob);
                this.markServiceAvailable('sarvam-stt');
                return { text, service: 'Sarvam AI STT' };
            } catch (error: any) {
                console.warn('Sarvam STT failed:', error);
                errors.push(`Sarvam: ${error.message}`);
                if (error.message.includes('QUOTA_EXCEEDED')) {
                    this.markServiceUnavailable('sarvam-stt', 'Quota exceeded');
                }
            }
        }

        // 4. Try ElevenLabs STT (final fallback)
        if (this.serviceStatus.get('elevenlabs-stt')?.available) {
            try {
                const text = await elevenLabsSTT(audioBlob);
                this.markServiceAvailable('elevenlabs-stt');
                return { text, service: 'ElevenLabs STT' };
            } catch (error: any) {
                console.warn('ElevenLabs STT failed:', error);
                errors.push(`ElevenLabs: ${error.message}`);
                if (error.message.includes('QUOTA_EXCEEDED')) {
                    this.markServiceUnavailable('elevenlabs-stt', 'Quota exceeded');
                }
            }
        }

        // All services failed
        throw new Error(`All STT services failed: ${errors.join(', ')}`);
    }

    // Multi-service conversation with 3 fallback services
    async sendMessage(message: string): Promise<{ response: string; bookingData?: any; service: string }> {
        const errors: string[] = [];

        // 1. Try Groq first (SUPER FAST and free)
        if (this.serviceStatus.get('groq')?.available && this.groq) {
            try {
                const result = await this.groq.sendMessage(message);
                this.markServiceAvailable('groq');
                this.currentConversationService = 'groq';
                return { ...result, service: 'Groq AI' };
            } catch (error: any) {
                console.warn('Groq failed:', error);
                errors.push(`Groq: ${error.message}`);
                if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('quota')) {
                    this.markServiceUnavailable('groq', 'Quota exceeded');
                }
            }
        }

        // 2. Try Gemini (generous free tier)
        if (this.serviceStatus.get('gemini')?.available && this.gemini) {
            try {
                const result = await this.gemini.sendMessage(message);
                this.markServiceAvailable('gemini');
                this.currentConversationService = 'gemini';
                return { ...result, service: 'Gemini AI' };
            } catch (error: any) {
                console.warn('Gemini failed:', error);
                errors.push(`Gemini: ${error.message}`);
                if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('quota')) {
                    this.markServiceUnavailable('gemini', 'Quota exceeded');
                }
            }
        }

        // 3. Try OpenAI GPT (reliable fallback)
        if (this.serviceStatus.get('openai-gpt')?.available && this.openai) {
            try {
                const result = await this.openai.sendMessage(message);
                this.markServiceAvailable('openai-gpt');
                this.currentConversationService = 'openai';
                return { ...result, service: 'OpenAI GPT' };
            } catch (error: any) {
                console.warn('OpenAI GPT failed:', error);
                errors.push(`OpenAI: ${error.message}`);
                if (error.message.includes('QUOTA_EXCEEDED')) {
                    this.markServiceUnavailable('openai-gpt', 'Quota exceeded');
                }
            }
        }

        // All services failed
        throw new Error(`All conversation services failed: ${errors.join(', ')}`);
    }

    getInitialGreeting(): string {
        if (this.groq) return this.groq.getInitialGreeting();
        if (this.gemini) return this.gemini.getInitialGreeting();
        if (this.openai) return this.openai.getInitialGreeting();
        return "Hello! I'm your booking assistant. How can I help you?";
    }

    getServiceStatus(): Map<string, ServiceStatus> {
        return this.serviceStatus;
    }

    getCurrentServices(): { stt: string; conversation: string } {
        // Find first available STT service
        const sttService = this.serviceStatus.get('whisper')?.available
            ? 'OpenAI Whisper'
            : this.serviceStatus.get('assemblyai')?.available
                ? 'AssemblyAI'
                : this.serviceStatus.get('sarvam-stt')?.available
                    ? 'Sarvam AI STT'
                    : this.serviceStatus.get('elevenlabs-stt')?.available
                        ? 'ElevenLabs STT'
                        : 'None available';

        const convService = this.currentConversationService === 'groq'
            ? 'Groq AI'
            : this.currentConversationService === 'gemini'
                ? 'Gemini AI'
                : 'OpenAI GPT';

        return { stt: sttService, conversation: convService };
    }
}
