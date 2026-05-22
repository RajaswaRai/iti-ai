import { AI_PROVIDER } from '../utils/env.js';
import type { ChatMessage } from '../utils/types.js';

export const generateChatResponse = async (_prompt: string, _history: ChatMessage[]) => {
    switch (AI_PROVIDER) {
        case 'groq':
            return "Groq belum diimplementasi";
        case 'openai':
            return "OpenAI belum diimplementasi";
        case 'gemini':
        default:
            return "Gemini belum dihubungkan ke Factory";
    }
};