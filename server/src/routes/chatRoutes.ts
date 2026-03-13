import { Router } from 'express';
import { handleChat } from '../controllers/chat.js';
import { validateChat } from '../middlewares/validateChat.js';

const router = Router();

router.post('/',validateChat, handleChat);

export default router;