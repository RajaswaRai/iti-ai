import { Router } from 'express';
import { handleChat } from '../controllers/chat.js';

const router = Router();

router.post('/', handleChat);

export default router;