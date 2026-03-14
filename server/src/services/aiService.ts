import { geminiClient } from "../config/geminiAI.js";
import {
  GEMINI_MODEL,
  GEMINI_INSTRUCT,
  GEMINI_TEMPERATURE,
  GEMINI_TOPP,
  GEMINI_MAX_RES
} from "../utils/env.js";
import { getRelevantContext } from "./ragService.js";
import type { ChatMessage } from "../utils/types.js";

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// Cek apakah error karena sinyal jelek atau server Google sibuk, agar auto-retry.
const isRetryableError = (error: unknown): boolean => {
  if (!error) return false;

  let status: unknown;
  let message = String(error);

  if (typeof error === "object" && error !== null) {
    const errObj = error as Record<string, unknown>;
    
    // Ambil status dan message
    status = errObj.status || errObj.statusCode || errObj.code;
    
    if (errObj.message) {
      message = String(errObj.message);
    }
  }

  const retryStatusCodes = [429, 500, 502, 503, 504];
  if (typeof status === "number" && retryStatusCodes.includes(status)) {
    return true;
  }

  // Network/timeout errors
  if (
    /timeout|timed out|ECONNRESET|EAI_AGAIN|ENOTFOUND|ECONNREFUSED/i.test(
      message,
    )
  ) {
    return true;
  }

  return false;
};

export const generateChatResponse = async (
  userMessage: string,
  history: ChatMessage[] = [],
): Promise<string> => {
  const context = await getRelevantContext(userMessage);

  const ragPrompt = `
    [DOKUMEN KAMPUS]
    ${context || "Tidak ada dokumen relevan."}

    [PERTANYAAN USER]
    ${userMessage}

    [INSTRUKSI WAJIB]
    1. Jawab SANGAT SINGKAT dan berikan poin utamanya saja. 
    2. JIKA informasi terbagi berdasarkan jenjang/kategori (misal: D3, S1, S2), sebutkan poin utamanya per jenjang tanpa menjabarkan syarat detailnya.
    3. Jika pengguna menanyakan DUA hal atau lebih, JAWAB SEMUANYA DENGAN SINGKAT.
    4. Langsung ke inti jawaban, DILARANG menggunakan kalimat pembuka basa-basi.
    5. WAJIB akhiri respons dengan SATU pertanyaan balik yang menawarkan penjelasan lebih detail (contoh: "Apakah Anda ingin mengetahui syarat dan aturan detailnya untuk jenjang S1 atau S2?").
    6. PASTIKAN kalimat penutup selesai dengan sempurna menggunakan tanda tanya (?). Jangan sampai terpotong!
  `.trim();

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
          maxOutputTokens: GEMINI_MAX_RES,
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
    } catch (error) {
      const isRetryable = isRetryableError(error);
      const shouldRetry = attempt < maxAttempts && isRetryable;

      if (!shouldRetry) {
        console.error("Gemini Error:", error);
        throw new Error("Gagal terkoneksi dengan AI.");
      }

      const delayMs = baseDelayMs * 2 ** (attempt - 1);
      console.warn(
        `Gemini request failed (attempt ${attempt}/${maxAttempts}), retrying in ${delayMs}ms...`,
        error,
      );
      await sleep(delayMs);
    }
  }

  //
  return "Maaf, saya tidak dapat memberikan jawaban.";
};
