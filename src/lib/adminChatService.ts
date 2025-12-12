import { CohereClient } from "cohere-ai";
import { getGeminiClient } from "./geminiService";
import { getGroqClient } from "./groqService";

const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY || 'k2w9VPP9mQc2peEliDcUScjj1aNKZGGmq7qF1hKf',
});

const SYSTEM_PROMPT = `
You are a smart admin assistant for a salon management system.
You help the owner manage employees, bookings, and revenue.

Supported Actions:
1. ADD_EMPLOYEE: Add a new staff member. Required: Name, Role, Phone, Email.
2. GET_REVENUE: Check income. 
3. REASSIGN_APPOINTMENTS: Handle staff absence.
4. ASSIGN_BOOKING: Assign or Reassign a specific booking to a stylist. Required: BookingID, StylistName.
5. CANCEL_BOOKING: Cancel a booking. Required: BookingID.
6. CHAT: Answer general questions about salon management, best practices, customer service, etc.

Analyze the user's message.
Return a JSON object in this EXACT format:
{
  "intent": "ADD_EMPLOYEE" | "GET_REVENUE" | "REASSIGN_APPOINTMENTS" | "ASSIGN_BOOKING" | "CANCEL_BOOKING" | "CHAT",
  "entities": {
    "name": "string",
    "role": "string",
    "phone": "string",
    "email": "string",
    "date": "YYYY-MM-DD",
    "bookingId": "string",
    "stylistName": "string"
  },
  "response": "Natural language response."
}

Rules:
- For ADD_EMPLOYEE: 
  - Check conversation history for Name, Role, Phone, and Email.
  - If ANY are missing, set intent="CHAT" and ask specifically for the missing fields.
  - **CRITICAL**: When you finally have ALL 4 fields (Name, Role, Phone, Email), you MUST return intent="ADD_EMPLOYEE" and include ALL of them in the "entities" object. Do not omit fields you collected in previous turns.
- **DATE EXTRACTION (CRITICAL)**: 
  - Extract dates EXACTLY as written in the user's message.
  - If user says "2025-12-06", extract date="2025-12-06" (NOT 2025-12-07 or any other date!)
  - If user says "yesterday", calculate: today is ${new Date().toISOString().split('T')[0]}, so yesterday is ${new Date(Date.now() - 86400000).toISOString().split('T')[0]}
  - If user says "today", use: ${new Date().toISOString().split('T')[0]}
  - Examples:
    * "what was revenue on 2025-12-06?" → date="2025-12-06"
    * "revenue for 2025-12-07?" → date="2025-12-07"
    * "yesterday's revenue?" → date="${new Date(Date.now() - 86400000).toISOString().split('T')[0]}"
- If valid action details are missing for other actions, set intent="CHAT" and ask for them.
- For general questions (e.g., "How to handle angry customers?"), set intent="CHAT" and provide a helpful, professional answer.

Current Date: ${new Date().toISOString().split('T')[0]}
`;

export interface AdminResponse {
    intent: string;
    entities: any;
    response: string;
}

export const processAdminMessage = async (message: string, history: any[]): Promise<AdminResponse> => {
    // 1. Try Cohere
    try {
        console.log("Trying Cohere...");
        const response = await cohere.chat({
            model: "command-r-08-2024", // Fixed: command-r is deprecated
            message: message,
            preamble: SYSTEM_PROMPT,
            chatHistory: history.map(h => ({ role: h.role === 'user' ? 'USER' : 'CHATBOT', message: h.message })),
            temperature: 0.3,
        });

        const text = response.text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return { intent: "CHAT", entities: {}, response: text };

    } catch (cohereError: any) {
        console.error("Cohere Failed Details:", JSON.stringify(cohereError, null, 2));
        console.error("Cohere Message:", cohereError.message);
        // 2. Try Gemini
        try {
            console.log("Trying Gemini...");
            const geminiClient = getGeminiClient();
            if (!geminiClient) throw new Error("Gemini client initialization failed");

            const model = geminiClient.getGenerativeModel({ model: "gemini-pro" }); // Fixed: fallback to stable gemini-pro

            const chat = model.startChat({
                history: [
                    {
                        role: "user",
                        parts: [{ text: SYSTEM_PROMPT }],
                    },
                    {
                        role: "model",
                        parts: [{ text: "Understood. I am ready to assist." }],
                    }
                ],
            });

            // Send message
            const result = await chat.sendMessage(message);
            const text = result.response.text();
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return { intent: "CHAT", entities: {}, response: text };

        } catch (geminiError: any) {
            console.error("Gemini Failed Details:", geminiError.message);
            // 3. Try Groq
            try {
                console.log("Trying Groq...");
                const groqClient = getGroqClient();
                if (!groqClient) throw new Error("Groq client initialization failed");

                const completion = await groqClient.chat.completions.create({
                    model: "llama3-70b-8192", // Fixed: Use stable model ID
                    messages: [
                        { role: "system", content: SYSTEM_PROMPT },
                        ...history.map(h => ({
                            role: (h.role === 'user' ? 'user' : 'assistant') as "user" | "assistant",
                            content: h.message
                        })),
                        { role: "user", content: message }
                    ],
                    response_format: { type: "json_object" }
                });

                const text = completion.choices[0]?.message?.content || "{}";
                return JSON.parse(text);

            } catch (groqError: any) {
                console.error("Groq Failed Details:", groqError.message);
                throw new Error(`All AI services failed. Cohere: ${cohereError.message}, Gemini: ${geminiError.message}, Groq: ${groqError.message}`);
            }
        }
    }
};
