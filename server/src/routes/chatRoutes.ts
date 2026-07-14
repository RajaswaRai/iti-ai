import { Router } from 'express';
import { handleChat, handleFeedback } from '../controllers/chat.js';
import { validateChat } from '../middlewares/validateChat.js';

const router = Router();

router.post('/', validateChat, handleChat);
router.post('/feedback', handleFeedback);

export default router;