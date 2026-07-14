import type { Request, Response } from 'express';
import { generateChatResponse } from '../services/aiService.js';
import type { ChatMessage } from '../utils/types.js'; 

export const handleChat = async (req: Request, res: Response): Promise<void> => {
    try {
        // Data dari body request 
        const { message, history } = req.body;

        // History
        const chatHistory: ChatMessage[] = Array.isArray(history) ? history : [];

        console.log(`💬Pesan masuk: "${message}" | Membawa ${chatHistory.length} history percakapan.`);

        // Proses
        const aiResponse = await generateChatResponse(message, chatHistory);

        const updatedHistory = [
            ...chatHistory,
            { role: 'user', parts: [{ text: message }] },
            { role: 'model', parts: [{ text: aiResponse }] }
        ];

        // Kirim jawaban ke user
        res.status(200).json({
            success: true,
            data: {
                reply: aiResponse,
                updatedHistory: updatedHistory
            }
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error di Chat Controller:", errorMessage);
        
        res.status(500).json({
            success: false,
            error: "Maaf, terjadi kesalahan internal pada server AI."
        });
    }
};

export const handleFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
        const { messageId, rating, comment, userMessage } = req.body;
        
        if (!messageId || typeof rating !== 'number') {
            res.status(400).json({ success: false, error: "Data feedback tidak valid." });
            return;
        }

        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        await prisma.chatFeedback.upsert({
            where: { message_id: messageId },
            update: { rating, comment, user_message: userMessage },
            create: {
                message_id: messageId,
                rating,
                comment,
                user_message: userMessage
            }
        });

        res.status(200).json({ success: true, message: "Feedback berhasil disimpan." });
    } catch (error) {
        console.error("Error saving feedback:", error);
        res.status(500).json({ success: false, error: "Gagal menyimpan feedback." });
    }
};