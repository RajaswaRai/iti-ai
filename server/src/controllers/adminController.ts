import type { Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../config/prisma.js';
import { pineconeClient } from '../config/pinecone.js';
import { PINECONE_INDEX } from '../utils/env.js';
import { parseFile } from '../utils/fileParser.js';
import { generateEmbedding } from '../services/embedding.js';
import { createChunks } from '../utils/chunking.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_FOLDER = path.resolve(__dirname, '../../temp_uploads');

if (!fs.existsSync(TEMP_FOLDER)) fs.mkdirSync(TEMP_FOLDER, { recursive: true });

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const getTextHash = (text: string) => {
    return crypto.createHash('sha256').update(text).digest('hex');
};

export const uploadKnowledge = async (req: Request, res: Response): Promise<void> => {
    try {
        const file = (req as any).file;
        
        if (!file) {
            res.status(400).json({ success: false, error: "Tidak ada dokumen yang diunggah." });
            return;
        }

        const originalName = file.originalname;
        const fileBuffer = file.buffer;
        const index = pineconeClient.index(PINECONE_INDEX);
        
        console.log(`Memproses Dokumen: ${originalName}...`);

        // Save ke Temp File -> diekstrak Parser
        const tempFilePath = path.join(TEMP_FOLDER, originalName);
        fs.writeFileSync(tempFilePath, fileBuffer);

        // Ekstrak Teks & Hapus Temp File
        const fullText = await parseFile(tempFilePath);
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

        // Chunking + Hashing
        const chunks = createChunks(fullText, 1500);
        const currentHashes = chunks.map((chunk: string) => getTextHash(chunk));

        // Ambil DNA Lama dari Database Prisma
        let dbDoc = await prisma.documentKnowledge.findUnique({ where: { filename: originalName } });
        const previousHashes = dbDoc?.chunk_hashes || [];

        // Hitung Mutasi
        const hashesToDelete = previousHashes.filter((h: string) => !currentHashes.includes(h));
        const hashesToUpload = currentHashes.filter((h: string) => !previousHashes.includes(h));

        if (hashesToDelete.length === 0 && hashesToUpload.length === 0) {
            res.status(200).json({ success: true, message: "Dokumen sama persis, tidak ada perubahan yang diunggah." });
            return;
        }

        console.log(`Mutasi: +${hashesToUpload.length} baru, -${hashesToDelete.length} lama, =${currentHashes.length - hashesToUpload.length} aman.`);

        // Hapus Data Lama di Pinecone
        if (hashesToDelete.length > 0) {
            const BATCH_SIZE = 100;
            for (let i = 0; i < hashesToDelete.length; i += BATCH_SIZE) {
                const batch = hashesToDelete.slice(i, i + BATCH_SIZE).filter(Boolean);
                if (batch.length > 0) {
                    await index.deleteMany({ filter: { source: originalName, hash: { "$in": batch } } });
                }
            }
        }

        // Upload Data Baru ke Pinecone
        const vectors = [];
        for (let i = 0; i < chunks.length; i++) {
            const hash = currentHashes[i];
            const chunkText = chunks[i];
            
            if (chunkText && hash && hashesToUpload.includes(hash)) {
                const embedding = await generateEmbedding(chunkText);
                vectors.push({
                    id: hash, 
                    values: embedding,
                    metadata: { text: chunkText, source: originalName, hash: hash }
                });
                await delay(500); // Menghindari Rate Limit
            }
        }

        if (vectors.length > 0) {
            await index.upsert({ records: vectors });
        }

        // Save DNA Baru ke Prisma
        await prisma.documentKnowledge.upsert({
            where: { filename: originalName },
            update: { chunk_hashes: currentHashes },
            create: { filename: originalName, chunk_hashes: currentHashes }
        });

        console.log(`Sinkronisasi dokumen ${originalName} selesai!`);
        res.status(200).json({ success: true, message: `Dokumen ${originalName} berhasil diunggah dan disinkronisasi ke AI!` });

    } catch (error) {
        console.error("Error di Upload Controller:", error);
        res.status(500).json({ success: false, error: "Terjadi kesalahan saat memproses dokumen AI." });
    }
};

export const deleteKnowledge = async (req: Request, res: Response): Promise<void> => {
    try {
        const filename = req.params.filename as string;

        if (!filename) {
            res.status(400).json({ success: false, error: "Nama file tidak boleh kosong." });
            return;
        }

        // Apakah dokumen ada di Supabase
        const document = await prisma.documentKnowledge.findUnique({
            where: { filename: filename }
        });

        if (!document) {
            res.status(404).json({ success: false, error: "Dokumen tidak ditemukan di database." });
            return;
        }

        // Hapus Vektor Pinecone
        try {
            const index = pineconeClient.index(PINECONE_INDEX);
            
            await index.deleteMany({
               filter: { source: filename } 
            });
            console.log(`Vektor untuk file ${filename} berhasil dihapus dari Pinecone.`);
        } catch (pineconeError) {
            console.error("Peringatan: Gagal menghapus dari Pinecone:", pineconeError);
        }

        // Hapus Metadata di SUPABASE
        await prisma.documentKnowledge.delete({
            where: { filename: filename }
        });

        res.status(200).json({ 
            success: true, 
            message: `Dokumen ${filename} berhasil dihapus secara permanen dari sistem.` 
        });

    } catch (error) {
        console.error("Error di Delete Knowledge Controller:", error);
        res.status(500).json({ 
            success: false, 
            error: "Terjadi kesalahan server saat menghapus dokumen." 
        });
    }
};

export const getKnowledgeList = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log(`\n================================`);
        console.log(`Permintaan Daftar Dokumen Knowledge...`);

        // Select dokumen dari database
        const documents = await prisma.documentKnowledge.findMany({
            select: {
                id: true,
                filename: true,
                created_at: true,
                updated_at: true,

            },
            orderBy: {
                created_at: 'desc'
            }
        });

        res.status(200).json({
            success: true,
            message: "Berhasil mengambil daftar dokumen.",
            data: documents
        });

    } catch (error) {
        console.error("Error di Get Knowledge Controller:", error);
        res.status(500).json({ 
            success: false, 
            error: "Terjadi kesalahan server saat mengambil data dokumen." 
        });
    }
};

export const getPendingUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await prisma.user.findMany({
            where: { role: 'PENDING' as any },
            select: { id: true, email: true, name: true, created_at: true }
        });
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, error: "Gagal mengambil data pendaftar." });
    }
};

export const approveUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        await prisma.user.update({
            where: { id },
            data: { role: 'ADMIN' }
        });
        res.status(200).json({ success: true, message: "Akses Admin diberikan." });
    } catch (error) {
        res.status(500).json({ success: false, error: "Gagal menyetujui akses." });
    }
};

export const getFeedbackList = async (req: Request, res: Response): Promise<void> => {
    try {
        const feedbacks = await prisma.chatFeedback.findMany({
            orderBy: { created_at: 'desc' }
        });
        res.status(200).json({ success: true, data: feedbacks });
    } catch (error) {
        console.error("Error getFeedbackList:", error);
        res.status(500).json({ success: false, error: "Gagal mengambil data feedback." });
    }
};

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const logs = await prisma.auditLog.findMany({
            orderBy: { created_at: 'desc' },
            include: { user: { select: { email: true, name: true } } }
        });
        res.status(200).json({ success: true, data: logs });
    } catch (error) {
        console.error("Error getAuditLogs:", error);
        res.status(500).json({ success: false, error: "Gagal mengambil audit log." });
    }
};