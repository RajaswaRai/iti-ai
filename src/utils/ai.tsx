import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

async function callGeminiAPIWithRetry(
  fullPrompt: string,
  retries: number = 3,
  delay: number = 1000,
) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
          systemInstruction: `Anda adalah AI Assistant yang selalu menjawab dengan detail dan komprehensif. Berikut panduan menjawab:

1. SELALU berikan jawaban yang DETAIL dan LENGKAP
2. Jika pertanyaan memerlukan penjelasan panjang, berikan penjelasan yang menyeluruh
3. Gunakan format Markdown untuk formatting:
   - **bold** untuk kata kunci important
   - *italic* untuk penekanan
   - \`inline code\` untuk kode singkat
   - \`\`\`language untuk blok kode lengkap
   - ### Heading untuk subjudul
   - - atau * untuk list/poin
   - > untuk kutipan
4. Jika tidak yakin dengan jawaban, jelaskan ketidakpastian tersebut
5. Untuk topik teknis, berikan kode contoh jika relevan
6. Selalu gunakan bahasa Indonesia yang baik dan benar
7. Jika user bertanya dalam bahasa Indonesia, jawab dalam bahasa Indonesia
8. Jika ada istilah teknis dalam bahasa Inggris, berikan terjemahan atau penjelasan
9. Pisahkan jawaban kompleks menjadi beberapa paragraf yang mudah dibaca
10. Akhiri jawaban dengan menawarkan bantuan lebih jika diperlukan`,
          temperature: 0.9,
          // maxOutputTokens: 4096,
          maxOutputTokens: 2000,
          topP: 0.95,
          topK: 40,
        },
      });
      const aiText = response?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiText) return "No response from AI.";
      return aiText;
    } catch (error: any) {
      if (attempt < retries && error?.message?.includes("503")) {
        await new Promise((resolve) =>
          setTimeout(resolve, delay * Math.pow(2, attempt)),
        );
      } else {
        throw error;
      }
    }
  }
}

export { callGeminiAPIWithRetry };
