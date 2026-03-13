import { geminiClient } from '../config/geminiAI.js'; 
import { 
    GEMINI_MODEL, 
    GEMINI_INSTRUCT, 
    GEMINI_MAX_RES, 
    GEMINI_TEMPERATURE, 
    GEMINI_TOPP 
} from '../utils/env.js';
import { getRelevantContext } from './ragService.js';
import type { ChatMessage } from '../utils/types.js';

export const generateChatResponse = async (userMessage: string, history: ChatMessage[] = []): Promise<string> => {
    try {
        const context = await getRelevantContext(userMessage);

        const dynamicInstruction = `${GEMINI_INSTRUCT}\n\n
            PERAN:
            Kamu adalah Asisten AI resmi Institut Teknologi Indonesia (ITI).
            TUGAS:
            Memberikan informasi tentang kampus ITI secara jelas, akurat, dan profesional.
            ATURAN UTAMA:
            1. Gunakan informasi dari KONTEKS sebagai sumber utama.
            2. Jangan membuat informasi yang tidak ada di KONTEKS.
            3. Jika informasi tidak ada di KONTEKS, katakan bahwa kamu tidak mengetahui informasi tersebut.
            4. Jika pertanyaan tidak terkait ITI, jawab secara umum namun tetap sopan sebagai asisten ITI.
            FORMAT JAWABAN:
            - Gunakan bahasa Indonesia yang jelas dan formal.
            - Jawaban harus **singkat dan langsung ke inti**.
            - Jika menggunakan list/poin:
            • Gunakan **maksimal 3–6 poin**
            • Setiap poin **maksimal 3–6 kata**
            • Hindari kalimat panjang
            - Jangan menyebut kata: konteks, RAG, database, sistem.
            KONTEKS INFORMASI:
            ${context}
            INSTRUKSI MENJAWAB:
            Gunakan informasi di atas untuk menjawab pertanyaan pengguna.
            Jika informasi tidak tersedia, jawab:
            "Maaf, saya belum menemukan informasi tersebut pada data yang tersedia."
`;
        
        const formattedHistory = history.map(msg => {
            const messageText = msg.parts?.[0]?.text || "";

            return {
                role: msg.role,
                parts: [{ text: messageText }]
            };
        });

        const chatContents = [
            ...formattedHistory,
            { role: 'user', parts: [{ text: userMessage }] }
        ];

        const response = await geminiClient.models.generateContent({
            model: GEMINI_MODEL,
            contents: chatContents,
            config: {
                systemInstruction: {
                    parts: [{ text: dynamicInstruction }]
                },
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