import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pineconeClient } from '../config/pinecone.js';
import { PINECONE_INDEX } from '../utils/env.js';
import { generateEmbedding } from '../services/embedding.js';
import { parseFile } from '../utils/fileParser.js';
import { createChunks } from '../utils/chunking.js';
import type { PineconeRecord } from '@pinecone-database/pinecone';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FOLDER = path.resolve(__dirname, '../data');

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const runIngestion = async () => {
    try {
        if (!fs.existsSync(DATA_FOLDER)) {
            console.error("❌ Folder data tidak ditemukan di:", DATA_FOLDER);
            return;
        }

        const files = fs.readdirSync(DATA_FOLDER);
        const index = pineconeClient.index(PINECONE_INDEX);

        for (const file of files) {
            console.log(`\n📄 Memproses: ${file}...`);
            const filePath = path.join(DATA_FOLDER, file);

            // Ekstrak teks
            const fullText = await parseFile(filePath);
            
            // Chunking
            const chunks = createChunks(fullText, 2000); 
            const vectors: PineconeRecord[] = [];

            console.log(`File dipecah menjadi ${chunks.length} bagian.`);

            // Loop tiap chunk 
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                if (!chunk) continue;

                try {
                    console.log(`Embedding chunk ${i + 1}/${chunks.length}...`);
                    const embedding = await generateEmbedding(chunk);

                    vectors.push({
                        id: `${file}-${i}-${Date.now()}`,
                        values: embedding,
                        metadata: { 
                            text: chunk,
                            source: file 
                        }
                    });

                    // Agar tidak kena Rate Limit
                    await delay(2000); 
                } catch (err: unknown) {
                    const errorMessage = err instanceof Error ? err.message : String(err);
                    console.error(`Gagal di chunk ${i}:`, errorMessage);
                    
                    if (errorMessage.includes('429')) {
                        console.log("Kena limit kang.");
                        await delay(30000);
                        i--; 
                    }
                }
            }

            // Upsert ke Pinecone
            if (vectors.length > 0) {
                await index.upsert({
                    records: vectors 
                });
            }
        }
        console.log("\n Data berhasil disimpan! ");
    } catch (error) {
        console.error("Ingestion Error:", error);
    }
};

runIngestion().catch(console.error);