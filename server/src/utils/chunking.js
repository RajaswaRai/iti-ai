export const createChunks = (text, size = 1000) => {
    // Membersihkan teks whitespace
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const chunks = [];
    for (let i = 0; i < cleanText.length; i += size) {
        chunks.push(cleanText.substring(i, i + size));
    }
    return chunks;
};
//# sourceMappingURL=chunking.js.map