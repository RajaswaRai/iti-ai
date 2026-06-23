import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { handleChat } from '../../src/controllers/chat.js';
import { generateChatResponse } from '../../src/services/aiService.js';

vi.mock('../../src/services/aiService.js', () => ({
    generateChatResponse: vi.fn()
}));

describe('Chat Controller', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockRequest = {
            body: {}
        };
        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
    });

    it('should handle chat and return updated history on success', async () => {
        mockRequest.body = {
            message: 'Halo AI',
            history: [{ role: 'user', parts: [{ text: 'Pesan lama' }] }]
        };

        vi.mocked(generateChatResponse).mockResolvedValue('Ini balasan dari AI');

        await handleChat(mockRequest as Request, mockResponse as Response);

        expect(generateChatResponse).toHaveBeenCalledWith('Halo AI', mockRequest.body.history);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        
        // Assert the returned JSON structure
        const jsonCall = vi.mocked(mockResponse.json!).mock.calls[0]![0]; 
        expect(jsonCall.success).toBe(true);
        expect(jsonCall.data.reply).toBe('Ini balasan dari AI');
        expect(jsonCall.data.updatedHistory).toHaveLength(3); // old user msg + new user msg + new ai msg
        expect(jsonCall.data.updatedHistory[2].role).toBe('model');
    });

    it('should initialize empty history if history is not an array', async () => {
        mockRequest.body = {
            message: 'Halo AI',
            history: 'bukan_array' // Invalid history format
        };

        vi.mocked(generateChatResponse).mockResolvedValue('Balasan');

        await handleChat(mockRequest as Request, mockResponse as Response);

        // It should default to empty array
        expect(generateChatResponse).toHaveBeenCalledWith('Halo AI', []);
        
        const jsonCall = vi.mocked(mockResponse.json!).mock.calls[0]![0];
        expect(jsonCall.data.updatedHistory).toHaveLength(2);
    });

    it('should return 500 error if AI service throws an exception', async () => {
        mockRequest.body = {
            message: 'Halo AI',
            history: []
        };

        vi.mocked(generateChatResponse).mockRejectedValue(new Error('AI is down'));

        await handleChat(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
            success: false,
            error: "Maaf, terjadi kesalahan internal pada server AI."
        });
    });
});
