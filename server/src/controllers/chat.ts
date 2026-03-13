import type { Request, Response } from 'express';
import { generateChatResponse } from '../services/aiService.js';
import type { ChatMessage } from '../utils/types.js';

export const handleChat = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userMessage, history } = req.body;

        if (!userMessage) {
            res.status(400).json({ error: "userMessage wajib diisi" });
            return;
        }

        const chatHistory: ChatMessage[] = Array.isArray(history) ? history : [];

        const reply = await generateChatResponse(userMessage, chatHistory);
        
        res.status(200).json({ res: reply });
    } catch (error) {
        console.error("Controller Error:", error);
        res.status(500).json({ error: "Terjadi kesalahan pada server AI" });
    }
};