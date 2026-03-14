import { geminiClient } from "../config/geminiAI.js";
import { GEMINI_MODEL, GEMINI_INSTRUCT, GEMINI_TEMPERATURE, GEMINI_TOPP, } from "../utils/env.js";
import { getRelevantContext } from "./ragService.js";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isRetryableError = (error) => {
    if (!error)
        return false;
    const status = error?.status ||
        error?.statusCode ||
        error?.code;
    const message = String(error?.message || error);
    const retryStatusCodes = [429, 500, 502, 503, 504];
    if (typeof status === "number" && retryStatusCodes.includes(status))
        return true;
    // Network/timeout errors
    if (/timeout|timed out|ECONNRESET|EAI_AGAIN|ENOTFOUND|ECONNREFUSED/i.test(message))
        return true;
    return false;
};
export const generateChatResponse = async (userMessage, history = []) => {
    const context = await getRelevantContext(userMessage);
    const ragPrompt = `
        [DOKUMEN KAMPUS]
        ${context || "Tidak ada dokumen relevan."}

        [PERTANYAAN USER]
        ${userMessage}

        [INSTRUKSI WAJIB - SUPER IRIT]
        1. Jika pengguna menanyakan DUA hal atau lebih, WAJIB JAWAB SEMUANYA TAPI SINGKAT.
        2. Rangkum jawaban tiap pertanyaan maksimal 5 poin singkat saja.
        3. Langsung ke inti, DILARANG pakai kalimat pembuka/penutup basa-basi.
        4. PASTIKAN SELURUH KALIMAT SELESAI DENGAN TITIK (.). Jangan terpotong!`.trim();
    const formattedHistory = history.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.parts?.[0]?.text || "" }],
    }));
    const maxAttempts = 3;
    const baseDelayMs = 500;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const responseStream = await geminiClient.models.generateContentStream({
                model: GEMINI_MODEL,
                contents: [
                    ...formattedHistory,
                    { role: "user", parts: [{ text: ragPrompt }] },
                ],
                config: {
                    systemInstruction: GEMINI_INSTRUCT,
                    temperature: GEMINI_TEMPERATURE,
                    topP: GEMINI_TOPP,
                },
            });
            // TAMPUNG TEKS
            let fullResponse = "";
            for await (const chunk of responseStream) {
                if (chunk.text) {
                    fullResponse += chunk.text;
                }
            }
            return fullResponse || "Maaf, saya tidak dapat memberikan jawaban.";
        }
        catch (error) {
            const isRetryable = isRetryableError(error);
            const shouldRetry = attempt < maxAttempts && isRetryable;
            if (!shouldRetry) {
                console.error("Gemini Error:", error);
                throw new Error("Gagal terkoneksi dengan AI.");
            }
            const delayMs = baseDelayMs * 2 ** (attempt - 1);
            console.warn(`Gemini request failed (attempt ${attempt}/${maxAttempts}), retrying in ${delayMs}ms...`, error);
            await sleep(delayMs);
        }
    }
    // Should never reach here, but Typescript wants a return
    return "Maaf, saya tidak dapat memberikan jawaban.";
};
//# sourceMappingURL=aiService.js.map