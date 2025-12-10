import Groq from 'groq-sdk';
import { BookingData } from './geminiService';
import { buildSystemPromptWithLocations, getSalonsByCity } from './locationHelper';

let groqInstance: Groq | null = null;

export const getGroqClient = () => {
    if (!groqInstance) {
        groqInstance = new Groq({
            apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || 'dummy_key', // Prevent crash if missing, handle auth error later
            dangerouslyAllowBrowser: true
        });
    }
    return groqInstance;
};

export class GroqService {
    private conversationHistory: Array<{ role: string; content: string }> = [];
    private systemPrompt: string = '';
    private initialized: boolean = false;

    async initialize() {
        if (this.initialized) return;

        this.systemPrompt = await buildSystemPromptWithLocations();
        this.conversationHistory = [
            { role: 'system', content: this.systemPrompt },
            { role: 'assistant', content: "Hello! I'm your salon booking assistant. Which city are you looking to book in?" }
        ];
        this.initialized = true;
    }

    async sendMessage(message: string): Promise<{ response: string; bookingData?: BookingData }> {
        await this.initialize();

        try {
            this.conversationHistory.push({ role: 'user', content: message });

            const completion = await getGroqClient().chat.completions.create({
                model: 'llama3-70b-8192', // Fast Groq model
                messages: this.conversationHistory as any,
            });

            const response = completion.choices[0]?.message?.content || 'Sorry, I did not understand that.';
            this.conversationHistory.push({ role: 'assistant', content: response });

            // Check if response contains booking data JSON
            if (response.includes('"confirmed": true')) {
                try {
                    const jsonMatch = response.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const bookingData = JSON.parse(jsonMatch[0]);
                        return { response: "Perfect! I've confirmed your booking.", bookingData };
                    }
                } catch (e) {
                    console.error('Failed to parse booking data:', e);
                }
            }

            return { response };
        } catch (error: any) {
            console.error('Groq error:', error);
            if (error?.status === 429) {
                throw new Error('QUOTA_EXCEEDED');
            }
            throw new Error(`Groq conversation failed: ${error?.message || 'Unknown error'}`);
        }
    }

    getInitialGreeting(): string {
        return "Hello! I'm your salon booking assistant. Which city are you looking to book in?";
    }
}
