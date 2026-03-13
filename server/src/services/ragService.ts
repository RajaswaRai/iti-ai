import { pineconeClient } from '../config/pinecone.js';
import { PINECONE_INDEX } from '../utils/env.js';
import { generateEmbedding } from './embedding.js';

export const getRelevantContext = async (query: string): Promise<string> => {
    try {
        // Ubah req user jadi embedding
        const queryEmbedding = await generateEmbedding(query);

        // Query ke Pinecone
        const index = pineconeClient.index(PINECONE_INDEX);
        const searchResponse = await index.query({
            vector: queryEmbedding,
            topK: 4,        
            includeMetadata: true
        });
        
        // Filter berdasarkan skor 
        const matches = searchResponse.matches.filter(match => (match.score || 0) > 0.4);

        const contexts = matches
            .map(match => {
                const text = match.metadata?.text as string;
                const source = match.metadata?.source as string;
                return `[Sumber: ${source}]\n${text}`;
            })
            .filter(Boolean);

        if (contexts.length === 0) {
            console.log("Tidak ada konteks yang relevan ditemukan.");
            return "";
        }
        console.log(`Berhasil mengambil ${contexts.length} potongan konteks.`);
        return contexts.join('\n\n');
    } catch (error) {
        console.error("Gagal mengambil konteks dari database:", error);
        return "";
    }
};