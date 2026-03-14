import { Pinecone } from '@pinecone-database/pinecone';
import { PINECONE_API_KEY } from '../utils/env.js';
// Inisialisasi koneksi ke database vektor Pinecone
export const pineconeClient = new Pinecone({
    apiKey: PINECONE_API_KEY,
});
//# sourceMappingURL=pinecone.js.map