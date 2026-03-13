import { geminiClient } from '../config/geminiAI.js';
import { GEMINI_EMBEDDING_MODEL } from '../utils/env.js';

export const generateEmbedding = async (text: string): Promise<number[]> => {
    try {
        const result = await geminiClient.models.embedContent({
            model: GEMINI_EMBEDDING_MODEL,
            contents: [{ parts: [{ text }] }],
        });

        const values = result.embeddings?.[0]?.values;

        if (!values) {
            throw new Error("Gagal mendapatkan vektor: Response kosong.");
        }
        
        return values;
    } catch (error) {
        console.error("Embedding Error:", error);
        throw error;
    }
};