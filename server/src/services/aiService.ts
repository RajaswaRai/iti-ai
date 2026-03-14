import { geminiClient } from "../config/geminiAI.js";
import {
  GEMINI_MODEL,
  GEMINI_INSTRUCT,
  GEMINI_TEMPERATURE,
  GEMINI_TOPP,
} from "../utils/env.js";
import { getRelevantContext } from "./ragService.js";
import type { ChatMessage } from "../utils/types.js";

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const isRetryableError = (error: any): boolean => {
  if (!error) return false;

  const status =
    (error as any)?.status ||
    (error as any)?.statusCode ||
    (error as any)?.code;
  const message = String((error as any)?.message || error);

  const retryStatusCodes = [429, 500, 502, 503, 504];
  if (typeof status === "number" && retryStatusCodes.includes(status))
    return true;

  // Network/timeout errors
  if (
    /timeout|timed out|ECONNRESET|EAI_AGAIN|ENOTFOUND|ECONNREFUSED/i.test(
      message,
    )
  )
    return true;

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
        1. Jika pengguna menanyakan DUA hal atau lebih, WAJIB JAWAB SEMUANYA.
        2. Rangkum jawaban tiap pertanyaan dengan detail tanpa menghilangkan kata kunci penting.
        3. Langsung ke inti, DILARANG pakai kalimat pembuka/penutup basa-basi.
        4. PASTIKAN SELURUH KALIMAT SELESAI DENGAN TITIK (.). Jangan terpotong!
        5. Pastikan memberi pertanyaan kembali mengenai informasi lebih lanjut  supaya percakapan lebih natural`.trim();

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
          maxOutputTokens: 1700,
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

  // Should never reach here, but Typescript wants a return
  return "Maaf, saya tidak dapat memberikan jawaban.";
};
