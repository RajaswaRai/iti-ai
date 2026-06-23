import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRelevantContext } from '../../src/services/ragService.js';
import { generateEmbedding } from '../../src/services/embedding.js';
import { pineconeClient } from '../../src/config/pinecone.js';

// Mock dependencies
vi.mock('../../src/services/embedding.js', () => ({
    generateEmbedding: vi.fn()
}));

vi.mock('../../src/config/pinecone.js', () => ({
    pineconeClient: {
        index: vi.fn()
    }
}));

describe('RAG Service', () => {
    const mockQueryFn = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Setup mock index query
        vi.mocked(pineconeClient.index).mockReturnValue({
            query: mockQueryFn
        } as any);
    });

    it('should return context string when relevant matches are found (>0.4 score)', async () => {
        //Embedding result
        vi.mocked(generateEmbedding).mockResolvedValue([0.1, 0.2, 0.3]);

        // Pinecone response
        mockQueryFn.mockResolvedValue({
            matches: [
                { score: 0.9, metadata: { source: 'doc1.pdf', text: 'Info penting 1' } },
                { score: 0.5, metadata: { source: 'doc2.pdf', text: 'Info penting 2' } },
                { score: 0.1, metadata: { source: 'doc3.pdf', text: 'Tidak relevan' } } // Should be filtered out
            ]
        });

        const context = await getRelevantContext('test query');

        expect(generateEmbedding).toHaveBeenCalledWith('test query');
        expect(pineconeClient.index).toHaveBeenCalled();
        expect(mockQueryFn).toHaveBeenCalledWith({
            vector: [0.1, 0.2, 0.3],
            topK: 5,
            includeMetadata: true
        });

        expect(context).toContain('[Sumber: doc1.pdf]');
        expect(context).toContain('Info penting 1');
        expect(context).toContain('[Sumber: doc2.pdf]');
        expect(context).toContain('Info penting 2');
        expect(context).not.toContain('Tidak relevan');
    });

    it('should return empty string when no matches exceed score 0.4', async () => {
        vi.mocked(generateEmbedding).mockResolvedValue([0.1, 0.2]);
        mockQueryFn.mockResolvedValue({
            matches: [
                { score: 0.3, metadata: { source: 'doc.pdf', text: 'Rendah' } }
            ]
        });

        const context = await getRelevantContext('test query');
        expect(context).toBe('');
    });

    it('should return empty string when pinecone search throws an error', async () => {
        vi.mocked(generateEmbedding).mockResolvedValue([0.1, 0.2]);
        mockQueryFn.mockRejectedValue(new Error('Pinecone is down'));

        const context = await getRelevantContext('test query');
        expect(context).toBe('');
    });
});
