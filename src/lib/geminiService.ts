import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export interface BookingData {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    salonName?: string;
    salonId?: string;
    services?: Array<{
        id: string;
        name: string;
        price: number;
        duration: number;
    }>;
    date?: string;
    time?: string;
    totalAmount?: number;
}

const SYSTEM_PROMPT = `You are a helpful salon booking assistant. Your job is to have a natural conversation with customers to collect booking information.

Available Salons:
- Glamour Lounge (ID: glamour-lounge-mumbai)
- Bliss Beauty Studio (ID: bliss-beauty-studio-delhi)
- Radiance Salon & Spa (ID: radiance-salon-spa-bangalore)

Available Services:
- Haircut & Styling (₹1000, 60 min)
- Hair Coloring (₹3500, 120 min)
- Spa Treatment (₹4500, 120 min)
- Manicure & Pedicure (₹1000, 60 min)
- Professional Makeup (₹3000, 90 min)
- Facial Treatment (₹1500, 75 min)

Your conversation flow:
1. Greet and ask what they need
2. Collect: name, email, phone, salon, service, date, time
3. Confirm all details
4. When confirmed, respond with ONLY a JSON object containing the booking data

Be friendly, concise, and natural. Guide the user through the booking process.

When the user confirms the booking, respond with EXACTLY this format (no other text):
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

export class GeminiConversation {
    private model;
    private chat;

    constructor() {
        this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        this.chat = this.model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: SYSTEM_PROMPT }],
                },
                {
                    role: 'model',
                    parts: [{ text: "Hello! I'm your salon booking assistant. I'd love to help you book an appointment. May I have your name?" }],
                },
            ],
        });
    }

    async sendMessage(message: string): Promise<{ response: string; bookingData?: BookingData }> {
        try {
            const result = await this.chat.sendMessage(message);
            const response = result.response.text();

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
            console.error('Gemini API error:', error);
            // Throw specific error for quota/permission issues
            if (error?.message?.includes('quota') || error?.message?.includes('429')) {
                throw new Error('QUOTA_EXCEEDED');
            }
            throw new Error(`Failed to get response from assistant: ${error?.message || 'Unknown error'}`);
        }
    }

    getInitialGreeting(): string {
        return "Hello! I'm your salon booking assistant. I'd love to help you book an appointment. May I have your name?";
    }
}
