import { Router } from 'express';
import { handleChat, handleFeedback } from '../controllers/chat.js';
import { validateChat } from '../middlewares/validateChat.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter khusus untuk Chat AI: Maks 20 request per 15 menit per IP
const chatLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, error: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/', chatLimiter, validateChat, handleChat);
router.post('/feedback', handleFeedback);

export default router;