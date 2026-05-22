import { AI_PROVIDER } from "../utils/env.js";
import { getRelevantContext } from "./ragService.js";
import type { ChatMessage } from "../utils/types.js";

// Import Para Adapters
import { callGemini } from "./providers/geminiAdapter.js";
import { callGroq } from "./providers/groqAdapter.js";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const isRetryableError = (error: unknown): boolean => {
    if (!error) return false;
    let status: unknown;
    let message = String(error);

    if (typeof error === "object" && error !== null) {
        const errObj = error as Record<string, unknown>;
        status = errObj.status || errObj.statusCode || errObj.code;
        if (errObj.message) message = String(errObj.message);
    }

    const retryStatusCodes = [429, 500, 502, 503, 504];
    if (typeof status === "number" && retryStatusCodes.includes(status)) return true;
    if (/timeout|timed out|ECONNRESET|EAI_AGAIN|ENOTFOUND|ECONNREFUSED/i.test(message)) return true;

    return false;
};

// Pemilih Model AI
const callAIProvider = async (ragPrompt: string, history: ChatMessage[]) => {
    switch (AI_PROVIDER.toLowerCase()) {
        case 'groq':
            return await callGroq(ragPrompt, history);
        case 'openai':
            // return await callOpenAI(ragPrompt, history);
            throw new Error("OpenAI belum diaktifkan");
        case 'gemini':
        default:
            return await callGemini(ragPrompt, history);
    }
};

export const generateChatResponse = async (
    userMessage: string,
    history: ChatMessage[] = [],
): Promise<string> => {
    // 1. Ambil Konteks Pinecone (Bebas topK 5 atau lebih)
    const context = await getRelevantContext(userMessage);

    // 🌟 TRIK 1: DIET KONTEKS (Batasi maksimal 15.000 karakter / ~3.500 token)
    // Jika Pinecone mengembalikan teks yang terlalu panjang, kita potong buntutnya
    const safeContext = context ? context.substring(0, 15000) : "";

    // 🌟 TRIK 2: DIET RIWAYAT CHAT
    // Jangan kirim semua history dari awal, cukup ambil 4 pesan terakhir saja
    // (Agar AI tetap ingat konteks pembicaraan, tapi tidak menghabiskan token)
    const recentHistory = history.slice(-4);

    // Rakit Prompt menggunakan konteks yang sudah di-diet
    const ragPrompt = `
[DOKUMEN KAMPUS]
${safeContext || "Tidak ada dokumen relevan."}

[PERTANYAAN USER]
${userMessage}

[INSTRUKSI WAJIB]
1. Jawab SANGAT SINGKAT dan berikan poin utamanya saja. 
2. Langsung ke inti jawaban, DILARANG menggunakan kalimat pembuka basa-basi.
3. WAJIB akhiri respons dengan SATU pertanyaan balik yang menawarkan penjelasan lebih detail.
4. PASTIKAN kalimat penutup selesai dengan sempurna menggunakan tanda tanya (?).
`.trim();

    const maxAttempts = 3;
    const baseDelayMs = 2000;

    // Eksekusi dengan Sistem Retry (Gunakan recentHistory, BUKAN history full)
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`Menggunakan Provider: ${AI_PROVIDER.toUpperCase()} (Attempt ${attempt})`);
            
            // FIX: Lempar recentHistory yang sudah dipotong ke Provider
            const aiResponse = await callAIProvider(ragPrompt, recentHistory);
            
            return aiResponse || "Maaf, saya tidak dapat memberikan jawaban saat ini.";

        } catch (error) {
            const isRetryable = isRetryableError(error);
            const shouldRetry = attempt < maxAttempts && isRetryable;

            if (!shouldRetry) {
                console.error(`AI Provider Error (${AI_PROVIDER} - Attempt ${attempt}):`, error);
                throw new Error("Gagal terkoneksi dengan AI. Server sedang sibuk.");
            }

            const delayMs = baseDelayMs * 2 ** (attempt - 1);
            console.warn(`Server AI sibuk, mencoba ulang dalam ${delayMs}ms...`);
            await sleep(delayMs);
        }
    }

    return "Maaf, server AI sedang antrean penuh. Silakan coba beberapa saat lagi.";
};