import { geminiClient } from '../config/geminiAI.js'; 
import { 
    GEMINI_MODEL, 
    GEMINI_INSTRUCT, 
    GEMINI_MAX_RES, 
    GEMINI_TEMPERATURE, 
    GEMINI_TOPP 
} from '../utils/env.js';
import type { ChatMessage } from '../utils/types.js';

export const generateChatResponse = async (userMessage: string, history: ChatMessage[] = []): Promise<string> => {
    try {
        const chatContents = [
            ...history,
            { role: 'user', parts: [{ text: userMessage }] }
        ];

        const response = await geminiClient.models.generateContent({
            model: GEMINI_MODEL,
            contents: chatContents,
            config: {
                systemInstruction: GEMINI_INSTRUCT,
                maxOutputTokens: GEMINI_MAX_RES,
                temperature: GEMINI_TEMPERATURE,
                topP: GEMINI_TOPP,
            }
        });

        return response.text || "Maaf, saya tidak dapat memberikan jawaban.";
    } catch (error) {
        console.error("Gemini Error:", error);
        throw new Error("Gagal terkoneksi dengan AI.");
    }
};