import { CohereClient } from "cohere-ai";
import { getGeminiClient } from "./geminiService";
import { getGroqClient } from "./groqService";

const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY || 'k2w9VPP9mQc2peEliDcUScjj1aNKZGGmq7qF1hKf',
});

const SYSTEM_PROMPT = `
You are a smart admin assistant for a salon management system.
You can help with:
1. Adding new employees.
2. Checking revenue.
3. Reassigning appointments.

Analyze the user's message and current conversation history.
Determine the INTENT and extract ENTITIES.

Return a JSON object in this EXACT format (no markdown):
{
  "intent": "ADD_EMPLOYEE" | "GET_REVENUE" | "REASSIGN_APPOINTMENTS" | "CHAT" | "UNKNOWN",
  "entities": {
     // For ADD_EMPLOYEE: name, role, specialties (array), joinDate, phone, email
     // For GET_REVENUE: date (YYYY-MM-DD)
     // For REASSIGN_APPOINTMENTS: employeeName, date (YYYY-MM-DD)
  },
  "response": "A helpful natural language response to the user. If information is missing, ask for it."
}

Rules:
- If the user wants to add an employee but is missing details (like Name or Role), ask for them in the "response" and set intent to "CHAT".
- Only set intent to "ADD_EMPLOYEE" when you have at least Name and Role. Defaults: joinDate = today, rating = 5, status = 'available'.
- For GET_REVENUE: If user says "yesterday", "today", calculate the date.
- For REASSIGN_APPOINTMENTS: If user says "Rahul is on leave today", infer intent is REASSIGN_APPOINTMENTS.

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
            model: "command-r", // Fixed: command-r-plus is deprecated
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
            const model = getGeminiClient().getGenerativeModel({ model: "gemini-1.5-flash" }); // Fixed: gemini-pro 404s, use 1.5-flash

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
                const completion = await getGroqClient().chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: SYSTEM_PROMPT },
                        ...history.map(h => ({
                            role: h.role === 'user' ? 'user' : 'assistant', // Fixed: 'model' is invalid for Groq
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
