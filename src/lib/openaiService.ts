import OpenAI from 'openai';
import { BookingData } from './geminiService';

const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true  // For client-side usage
});

const SYSTEM_PROMPT = `You are a helpful salon booking assistant. Collect the following information through natural conversation:

Available Salons:
- Glamour Lounge (Mumbai)
- Bliss Beauty Studio (Delhi)
- Radiance Salon & Spa (Bangalore)

Available Services:
- Haircut & Styling (₹1000, 60 min)
- Hair Coloring (₹3500, 120 min)
- Spa Treatment (₹4500, 120 min)
- Manicure & Pedicure (₹1000, 60 min)
- Professional Makeup (₹3000, 90 min)
- Facial Treatment (₹1500, 75 min)

Collect: name, email, phone, salon, service, date, time

When user confirms, respond ONLY with JSON in this exact format:
{
  "confirmed": true,
  "customerName": "...",
  "customerEmail": "...",
  "customerPhone": "...",
  "salonName": "...",
  "salonId": "...",
  "services": [{"id": "...", "name": "...", "price": 1000, "duration": 60}],
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "totalAmount": 1000
}`;

export class OpenAIService {
    private conversationHistory: Array<{ role: string; content: string }> = [];

    constructor() {
        this.conversationHistory = [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'assistant', content: "Hello! I'm your salon booking assistant. May I have your name?" }
        ];
    }

    // Speech-to-Text using Whisper
    async transcribeAudio(audioBlob: Blob): Promise<string> {
        try {
            const file = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });

            const transcription = await openai.audio.transcriptions.create({
                file: file,
                model: 'whisper-1',
            });

            return transcription.text;
        } catch (error: any) {
            if (error?.status === 429) {
                console.log('⚠️ OpenAI Whisper quota exceeded, falling back to next service');
                throw new Error('QUOTA_EXCEEDED');
            }
            console.error('OpenAI Whisper error:', error);
            throw new Error(`Whisper transcription failed: ${error?.message || 'Unknown error'}`);
        }
    }

    // Conversation using GPT
    async sendMessage(message: string): Promise<{ response: string; bookingData?: BookingData }> {
        try {
            this.conversationHistory.push({ role: 'user', content: message });

            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
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
            if (error?.status === 429) {
                console.log('⚠️ OpenAI GPT quota exceeded, falling back to next service');
                throw new Error('QUOTA_EXCEEDED');
            }
            console.error('OpenAI GPT error:', error);
            throw new Error(`GPT conversation failed: ${error?.message || 'Unknown error'}`);
        }
    }

    getInitialGreeting(): string {
        return "Hello! I'm your salon booking assistant. May I have your name?";
    }
}
