import { geminiClient } from '../../config/geminiAI.js';
import { GEMINI_MODEL, GEMINI_INSTRUCT, GEMINI_TEMPERATURE, GEMINI_TOPP, GEMINI_MAX_RES } from '../../utils/env.js';
import type { ChatMessage } from '../../utils/types.js';

export const callGemini = async (ragPrompt: string, history: ChatMessage[]): Promise<string> => {
    // History
    const formattedHistory = history.map((msg) => ({
        role: msg.role, 
        parts: [{ text: msg.parts?.[0]?.text || "" }],
    }));

    const responseStream = await geminiClient.models.generateContentStream({
        model: GEMINI_MODEL,
        contents: [
            ...formattedHistory,
            { role: "user", parts: [{ text: ragPrompt }] },
        ],
        config: {
            systemInstruction: GEMINI_INSTRUCT,
            temperature: Number(GEMINI_TEMPERATURE),
            topP: Number(GEMINI_TOPP),
            maxOutputTokens: Number(GEMINI_MAX_RES),
        },
    });

    let fullResponse = "";
    for await (const chunk of responseStream) {
        if (chunk.text) fullResponse += chunk.text;
    }

    return fullResponse;
};