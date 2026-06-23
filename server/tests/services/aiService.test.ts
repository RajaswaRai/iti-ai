import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateChatResponse } from '../../src/services/aiService.js';
import { getRelevantContext } from '../../src/services/ragService.js';
import { callGemini } from '../../src/services/providers/geminiAdapter.js';
import * as envModule from '../../src/utils/env.js';

vi.mock('../../src/services/ragService.js', () => ({
    getRelevantContext: vi.fn()
}));

vi.mock('../../src/services/providers/geminiAdapter.js', () => ({
    callGemini: vi.fn()
}));

vi.mock('../../src/services/providers/groqAdapter.js', () => ({
    callGroq: vi.fn()
}));

describe('AI Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default gemini as provider
        vi.spyOn(envModule, 'AI_PROVIDER', 'get').mockReturnValue('gemini');
    });

    it('should generate chat response successfully', async () => {
        vi.mocked(getRelevantContext).mockResolvedValue('Ini adalah konteks pinecone');
        vi.mocked(callGemini).mockResolvedValue('Ini jawaban dari Gemini');

        const response = await generateChatResponse('Halo', []);

        expect(getRelevantContext).toHaveBeenCalledWith('Halo');
        expect(callGemini).toHaveBeenCalled();
        expect(response).toBe('Ini jawaban dari Gemini');
    });

    it('should slice context if it is too long (diet konteks)', async () => {
        const veryLongContext = 'A'.repeat(20000);
        vi.mocked(getRelevantContext).mockResolvedValue(veryLongContext);
        vi.mocked(callGemini).mockResolvedValue('OK');

        await generateChatResponse('Test', []);

        // The adapter called with a prompt at most 15000 'A's
        const callArgs = vi.mocked(callGemini).mock.calls[0]![0];
        expect(callArgs.length).toBeLessThan(16000);
    });

    it('should slice chat history to last 4 messages (diet riwayat)', async () => {
        vi.mocked(getRelevantContext).mockResolvedValue('Konteks');
        vi.mocked(callGemini).mockResolvedValue('OK');

        const history = [
            { role: 'user', parts: [{ text: '1' }] },
            { role: 'model', parts: [{ text: '2' }] },
            { role: 'user', parts: [{ text: '3' }] },
            { role: 'model', parts: [{ text: '4' }] },
            { role: 'user', parts: [{ text: '5' }] },
            { role: 'model', parts: [{ text: '6' }] }
        ];

        await generateChatResponse('Halo', history as any);

        const recentHistoryArg = vi.mocked(callGemini).mock.calls[0]![1];
        
        expect(recentHistoryArg).toHaveLength(4);
        expect(recentHistoryArg![0]?.parts?.[0]?.text).toBe('3');
        expect(recentHistoryArg![3]?.parts?.[0]?.text).toBe('6');
    });

    it('should retry on retryable error and eventually fail if all attempts fail', async () => {
        vi.mocked(getRelevantContext).mockResolvedValue('Konteks');
        
        // Mock 429 error
        const error429 = new Error('Too many requests');
        (error429 as any).status = 429;
        vi.mocked(callGemini).mockRejectedValue(error429);

        // Setting timeout for sleep to be instant for tests
        vi.useFakeTimers();

        // Fungsi
        const promise = generateChatResponse('Halo', []);
        
        const catcher = promise.catch((err) => err);

        await vi.runAllTimersAsync();

        // Periksa error
        const error = await catcher;
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Gagal terkoneksi dengan AI. Server sedang sibuk.');

        expect(callGemini).toHaveBeenCalledTimes(3);

        vi.useRealTimers();
    });
});
