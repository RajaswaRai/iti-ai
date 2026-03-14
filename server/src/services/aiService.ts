import { geminiClient } from '../config/geminiAI.js'; 
import { 
    GEMINI_MODEL, 
    GEMINI_INSTRUCT, 
    GEMINI_TEMPERATURE, 
    GEMINI_TOPP 
} from '../utils/env.js';
import { getRelevantContext } from './ragService.js';
import type { ChatMessage } from '../utils/types.js';

export const generateChatResponse = async (userMessage: string, history: ChatMessage[] = []): Promise<string> => {
    try {
        const context = await getRelevantContext(userMessage);

        const ragPrompt = `
        [DOKUMEN KAMPUS]
        ${context || "Tidak ada dokumen relevan."}

        [PERTANYAAN USER]
        ${userMessage}

        [INSTRUKSI WAJIB - SUPER IRIT]
        1. Jika pengguna menanyakan DUA hal atau lebih, WAJIB JAWAB SEMUANYA TAPI SINGKAT.
        2. Rangkum jawaban tiap pertanyaan maksimal 5 poin singkat saja.
        3. Langsung ke inti, DILARANG pakai kalimat pembuka/penutup basa-basi.
        4. PASTIKAN SELURUH KALIMAT SELESAI DENGAN TITIK (.). Jangan terpotong!`.trim();

        const formattedHistory = history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.parts?.[0]?.text || "" }]
        }));

        const responseStream = await geminiClient.models.generateContentStream({
            model: GEMINI_MODEL,
            contents: [
                ...formattedHistory,
                { role: 'user', parts: [{ text: ragPrompt }] }
            ],
            config: {
                systemInstruction: GEMINI_INSTRUCT,
                temperature: GEMINI_TEMPERATURE, 
                topP: GEMINI_TOPP,
            }
        });

        // TAMPUNG TEKS
        let fullResponse = "";
        
        for await (const chunk of responseStream) {
            if (chunk.text) { 
                fullResponse += chunk.text;
            }
        }
        
        return fullResponse || "Maaf, saya tidak dapat memberikan jawaban.";
    } catch (error) {
        console.error("Gemini Error:", error);
        throw new Error("Gagal terkoneksi dengan AI.");
    }
};