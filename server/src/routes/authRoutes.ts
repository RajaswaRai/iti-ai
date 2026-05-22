import { Router } from 'express';
import { login, refreshToken, logout, googleLogin, forgotPassword, resetPassword, verifyResetToken } from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/google', googleLogin);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/reset-password/verify', verifyResetToken);


export default router;