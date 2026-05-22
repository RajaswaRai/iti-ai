import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { pineconeClient } from '../config/pinecone.js';
import { PINECONE_INDEX } from '../utils/env.js';
import { generateEmbedding } from '../services/embedding.js';
import { parseFile } from '../utils/fileParser.js';
import type { PineconeRecord, RecordMetadata } from '@pinecone-database/pinecone';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FOLDER = path.resolve(__dirname, '../data');
const STATE_FILE = path.join(__dirname, 'ingest-state.json'); 

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const getTextHash = (text: string) => {
    return crypto.createHash('sha256').update(text).digest('hex');
};

const smartChunking = (text: string, maxChars: number = 2000): string[] => {
    const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
    const chunks: string[] = [];
    let currentChunk = "";

    for (const p of paragraphs) {
        if ((currentChunk.length + p.length) > maxChars && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = "";
        }
        currentChunk += p + "\n\n";
    }
    if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
    return chunks;
};

const loadState = (): Record<string, string[]> => {
    if (fs.existsSync(STATE_FILE)) {
        const fileContent = fs.readFileSync(STATE_FILE, 'utf-8').trim();
        if (!fileContent) {
            return {};
        }
        return JSON.parse(fileContent);
    }
    return {};
};

const saveState = (state: Record<string, string[]>) => {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
};

const runIngestion = async () => {
    try {
        if (!fs.existsSync(DATA_FOLDER)) {
            console.error("Folder data tidak ditemukan di:", DATA_FOLDER);
            return;
        }

        const files = fs.readdirSync(DATA_FOLDER);
        const index = pineconeClient.index(PINECONE_INDEX);
        const fileState = loadState();
        let stateChanged = false;

        // ==========================================
        // TAHAP 1: CLEANUP FILE YANG DIHAPUS DARI FOLDER
        // ==========================================
        for (const knownFile of Object.keys(fileState)) {
            if (!files.includes(knownFile)) {
                console.log(`\n🗑️ [CLEANUP] File '${knownFile}' dihapus dari folder.`);
                try {
                    // FIX: KEMBALI MENGGUNAKAN METADATA FILTER (Terbukti 100% jalan di servermu)
                    await index.deleteMany({ filter: { source: knownFile } });
                    console.log(`   ✅ Vektor lama berhasil dibersihkan.`);
                } catch (err) {
                    console.error(`   ❌ Gagal menghapus vektor lama:`, err);
                }
                delete fileState[knownFile];
                stateChanged = true;
            }
        }

        // ==========================================
        // TAHAP 2: PROSES DATA & MUTATION TRACKING
        // ==========================================
        for (const file of files) {
            console.log(`\n================================`);
            console.log(`📄 Menganalisis File: ${file}...`);
            
            const filePath = path.join(DATA_FOLDER, file);
            const fullText = await parseFile(filePath);
            const chunks = smartChunking(fullText, 2000); 
            
            const previousHashes = fileState[file] || [];
            const currentHashes = chunks.map(chunk => getTextHash(chunk));

            const hashesToDelete = previousHashes.filter(h => !currentHashes.includes(h));
            const hashesToUpload = currentHashes.filter(h => !previousHashes.includes(h));

            if (hashesToDelete.length === 0 && hashesToUpload.length === 0) {
                console.log(`⏭️ SKIP: Tidak ada perubahan huruf sama sekali pada dokumen ini.`);
                continue;
            }

            console.log(`📊 Hasil Analisis:`);
            console.log(`   - 🗑️ ${hashesToDelete.length} paragraf lama yang harus dibuang.`);
            console.log(`   - 🚀 ${hashesToUpload.length} paragraf baru/revisi yang harus diupload.`);
            console.log(`   - 🛡️ ${currentHashes.length - hashesToUpload.length} paragraf aman (di-skip).`);

            if (hashesToDelete.length > 0) {
                try {
                    const BATCH_SIZE = 100;
                    for (let i = 0; i < hashesToDelete.length; i += BATCH_SIZE) {
                        const batch = hashesToDelete.slice(i, i + BATCH_SIZE).filter(Boolean);
                        if (batch.length > 0) {
                            await index.deleteMany({
                                filter: {
                                    source: file,
                                    hash: { "$in": batch } 
                                }
                            });
                        }
                    }
                    console.log(`   ✅ ${hashesToDelete.length} data lama berhasil dihapus.`);
                } catch (err) {
                    console.error(`   ❌ Pinecone Error saat menghapus:`, err);
                }
                stateChanged = true;
            }

            const vectors: PineconeRecord<RecordMetadata>[] = [];
            for (let i = 0; i < chunks.length; i++) {
                const hash = currentHashes[i];
                const chunkText = chunks[i];
                
                if (!hash || !chunkText) continue;

                if (hashesToUpload.includes(hash)) {
                    process.stdout.write(`\n🔄 Embedding paragraf baru... `);
                    try {
                        const embedding = await generateEmbedding(chunkText);
                        
                        vectors.push({
                            id: hash, 
                            values: embedding,
                            metadata: { text: chunkText, source: file, hash: hash } // Tambah hash ke metadata buat jaga-jaga
                        });
                        
                        process.stdout.write(`OK!`);
                        await delay(2000); 
                    } catch (err: unknown) {
                        const errorMessage = err instanceof Error ? err.message : String(err);
                        console.error(`\n❌ Gagal di chunk hash ${hash}:`, errorMessage);
                        if (errorMessage.includes('429')) {
                            console.log("⏳ Kena limit. Istirahat 30 detik...");
                            await delay(30000);
                            i--; 
                        }
                    }
                }
            }

            if (vectors.length > 0) {
                console.log(`\n🚀 Menyimpan ${vectors.length} data mutasi ke Pinecone...`);
                await index.upsert({ records: vectors });
                stateChanged = true;
            }

            fileState[file] = currentHashes;
        }

        if (stateChanged) saveState(fileState);
        console.log("\n✅ SINKRONISASI DATA SELESAI! ✅");

    } catch (error) {
        console.error("Ingestion Error:", error);
    }
};

runIngestion().catch(console.error);