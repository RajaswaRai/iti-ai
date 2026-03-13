export const createChunks = (text: string, size: number = 1000): string[] => {
    // Membersihkan teks whitespace
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const chunks: string[] = [];
    
    for (let i = 0; i < cleanText.length; i += size) {
        chunks.push(cleanText.substring(i, i + size));
    }
    
    return chunks;
};