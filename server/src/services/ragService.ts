import { pineconeClient } from '../config/pinecone.js';
import { PINECONE_INDEX } from '../utils/env.js';
import { generateEmbedding } from './embedding.js';

export const getRelevantContext = async (query: string): Promise<string> => {
    try {
        const queryEmbedding = await generateEmbedding(query);

        const index = pineconeClient.index(PINECONE_INDEX);
        const searchResponse = await index.query({
            vector: queryEmbedding,
            topK: 5,             
            includeMetadata: true
        });
        
        const contexts = searchResponse.matches
            .map(match => match.metadata?.text as string)
            .filter(Boolean);

        if (contexts.length === 0) {
            return "Tidak ada informasi tambahan dari database kampus.";
        }

        return contexts.join('\n---\n');
    } catch (error) {
        console.error("Gagal mengambil konteks dari Pinecone:", error);
        return "";
    }
};