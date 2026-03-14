import { generateChatResponse } from '../services/aiService.js';
export const handleChat = async (req, res) => {
    try {
        // Data dari body request 
        const { message, history } = req.body;
        // History
        const chatHistory = Array.isArray(history) ? history : [];
        console.log(`💬Pesan masuk: "${message}" | Membawa ${chatHistory.length} history percakapan.`);
        // Proses
        const aiResponse = await generateChatResponse(message, chatHistory);
        const updatedHistory = [
            ...chatHistory,
            { role: 'user', parts: [{ text: message }] },
            { role: 'model', parts: [{ text: aiResponse }] }
        ];
        // Kirim jawaban ke user
        res.status(200).json({
            success: true,
            data: {
                reply: aiResponse,
                updatedHistory: updatedHistory
            }
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error di Chat Controller:", errorMessage);
        res.status(500).json({
            success: false,
            error: "Maaf, terjadi kesalahan internal pada server AI."
        });
    }
};
//# sourceMappingURL=chat.js.map