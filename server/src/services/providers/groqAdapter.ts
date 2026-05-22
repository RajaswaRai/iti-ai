import Groq from 'groq-sdk';
import { GEMINI_INSTRUCT, GEMINI_TEMPERATURE, GEMINI_MAX_RES } from '../../utils/env.js';
import type { ChatMessage } from '../../utils/types.js';

// Menggunakan process.env bawaan Node untuk API Key
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

export const callGroq = async (ragPrompt: string, history: ChatMessage[]): Promise<string> => {
    // Tipe eksplisit agar SDK tidak protes
    type GroqRole = "system" | "user" | "assistant";

    const systemMessage = { 
        role: "system" as GroqRole, 
        content: GEMINI_INSTRUCT || "You are a helpful assistant." 
    };

    const historyMessages = history.map(msg => ({
        role: (msg.role === 'model' ? 'assistant' : 'user') as GroqRole,
        content: msg.parts?.[0]?.text || ""
    }));

    const promptMessage = { 
        role: "user" as GroqRole, 
        content: ragPrompt 
    };

    const formattedMessages = [systemMessage, ...historyMessages, promptMessage];

    // Tembak API Groq
    const chatCompletion = await groq.chat.completions.create({
        messages: formattedMessages,
        model: "llama-3.1-8b-instant", 
        temperature: Number(GEMINI_TEMPERATURE),
        max_tokens: Number(GEMINI_MAX_RES),
    });

    return chatCompletion.choices[0]?.message?.content || "";
};