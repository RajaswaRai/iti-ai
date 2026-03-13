import type { Request, Response, NextFunction } from 'express';

export const validateChat = (req: Request, res: Response, next: NextFunction): void => {
    const { message, history } = req.body;

    // Validasi Keberadaan & Tipe Data Chat
    if (!message || typeof message !== 'string') {
        res.status(400).json({ success: false, error: "Pesan (message) wajib diisi dan harus berupa teks." });
        return;
    }

    // Bersihkan spasi berlebih
    const trimmedMessage = message.trim();

    // Validasi Pesan Kosong
    if (trimmedMessage.length === 0) {
        res.status(400).json({ success: false, error: "Pesan tidak boleh hanya berisi spasi kosong." });
        return;
    }

    // Validasi Panjang Maksimal
    if (trimmedMessage.length > 1000) {
        res.status(400).json({ success: false, error: "Pesan terlalu panjang. Maksimal 1000 karakter." });
        return;
    }

    // Validasi Tipe Data History
    if (history && !Array.isArray(history)) {
        res.status(400).json({ success: false, error: "Format riwayat obrolan tidak valid." });
        return;
    }

    // Jika semua lolos
    req.body.message = trimmedMessage;
    
    // Masuk ke controller
    next();
};