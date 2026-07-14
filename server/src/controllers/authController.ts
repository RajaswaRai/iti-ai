import type { Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../utils/mailer.js';
import prisma from '../config/prisma.js';
import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } from '../utils/env.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Konfigurasi Cookie Production & Development
const getCookieOptions = () => {
    const isProd = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProd, 
        sameSite: (isProd ? 'none' : 'lax') as "none" | "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 
    };
};

// JWT Expiration Config
const accessExpires = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const refreshExpires = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

//* FUNGSI LOGIN
//* ==========================================
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        let user = await prisma.user.findUnique({ where: { email } });

        //* SEEDER //
        if (!user && email === "garxadmin@iti-ai.com" && password === "prialunak34") {
            const hashedPassword = await bcrypt.hash(password, 10);
            user = await prisma.user.create({
                data: {
                    email,
                    password_hash: hashedPassword,
                    name: "Super Admin",
                    role: "SUPER_ADMIN"
                }
            });
            console.log("Akun Super Admin pertama berhasil dibuat otomatis!");
        }

        if (!user || !user.password_hash) {
            res.status(401).json({ success: false, error: "Email atau password salah." });
            return;
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            res.status(401).json({ success: false, error: "Email atau password salah." });
            return;
        }

        const accessToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_ACCESS_SECRET,
            { expiresIn: accessExpires } as SignOptions
        );

        const refreshToken = jwt.sign(
            { id: user.id },
            JWT_REFRESH_SECRET,
            { expiresIn: refreshExpires } as SignOptions
        );

        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        const expiredAt = new Date();
        expiredAt.setDate(expiredAt.getDate() + 7); 

        await prisma.refreshToken.create({
            data: {
                user_id: user.id,
                token_hash: hashedRefreshToken,
                expired_at: expiredAt,
                device_info: req.headers['user-agent'] || 'Unknown',
                ip_address: req.ip || 'Unknown'
            }
        });

        res.cookie('refresh_token', refreshToken, getCookieOptions());

        res.status(200).json({
            success: true,
            message: "Login berhasil",
            data: { access_token: accessToken, role: user.role, name: user.name }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, error: "Terjadi kesalahan pada server saat login." });
    }
};

//* FUNGSI REFRESH TOKEN
//* ==========================================
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.cookies?.refresh_token;

        if (!token) {
            res.status(401).json({ success: false, error: "Sesi login tidak ditemukan. Silakan login ulang." });
            return;
        }

        let decoded: any;
        try {
            decoded = jwt.verify(token, JWT_REFRESH_SECRET);
        } catch {
            res.status(403).json({ success: false, error: "Sesi login telah kadaluarsa." });
            return;
        }

        const userTokens = await prisma.refreshToken.findMany({ where: { user_id: decoded.id } });
        let isValid = false;

        for (const dbToken of userTokens) {
            if (await bcrypt.compare(token, dbToken.token_hash)) {
                isValid = true;
                break;
            }
        }

        if (!isValid) {
            res.status(403).json({ success: false, error: "Token tidak dikenali atau telah di-revoke." });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) throw new Error("User tidak ditemukan");

        const newAccessToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_ACCESS_SECRET,
            { expiresIn: accessExpires } as SignOptions
        );

        res.status(200).json({
            success: true,
            message: "Access Token berhasil diperbarui.",
            data: { access_token: newAccessToken }
        });

    } catch (error) {
        console.error("Refresh Token Error:", error);
        res.status(500).json({ success: false, error: "Terjadi kesalahan pada server." });
    }
};

//* FUNGSI LOGOUT (Hapus Sesi)
//* ==========================================
export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.cookies?.refresh_token;

        if (token) {
            try {
                const decoded: any = jwt.verify(token, JWT_REFRESH_SECRET);
                const userTokens = await prisma.refreshToken.findMany({ where: { user_id: decoded.id } });
                
                for (const dbToken of userTokens) {
                    if (await bcrypt.compare(token, dbToken.token_hash)) {
                        await prisma.refreshToken.delete({ where: { id: dbToken.id } });
                        break;
                    }
                }
            } catch { /* Abaikan error verify saat logout */ }
        }

        const cookieOptions = getCookieOptions();
        res.clearCookie('refresh_token', {
            httpOnly: cookieOptions.httpOnly,
            secure: cookieOptions.secure,
            sameSite: cookieOptions.sameSite as "none" | "lax"
        });

        res.status(200).json({ success: true, message: "Berhasil logout." });

    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({ success: false, error: "Terjadi kesalahan saat logout." });
    }
};

//* FUNGSI LOGIN OAUTH GOOGLE
//* ==========================================
export const googleLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.body; 

        if (!token) {
            res.status(400).json({ success: false, error: "Token Google tidak ditemukan." });
            return;
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID as string,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            res.status(400).json({ success: false, error: "Gagal memverifikasi akun Google." });
            return;
        }

        const email = payload.email;
        const name = payload.name || "Admin ITI";

        let user = await prisma.user.findUnique({ where: { email } });
        
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    name,
                    role: "PENDING" as any
                }
            });
            console.log(`Akun Google baru (${email}) mendaftar, status: PENDING.`);
        }

        if ((user.role as string) === "PENDING" || (user.role as string) === "USER") {
            res.status(403).json({ 
                success: false, 
                error: "Akun Anda terdaftar dengan status PENDING. Silakan hubungi Super Admin untuk mendapatkan akses." 
            });
            return;
        }

        const accessToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_ACCESS_SECRET,
            { expiresIn: accessExpires } as SignOptions
        );

        const refreshToken = jwt.sign(
            { id: user.id },
            JWT_REFRESH_SECRET,
            { expiresIn: refreshExpires } as SignOptions
        );

        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        const expiredAt = new Date();
        expiredAt.setDate(expiredAt.getDate() + 7);

        await prisma.refreshToken.create({
            data: {
                user_id: user.id,
                token_hash: hashedRefreshToken,
                expired_at: expiredAt,
                device_info: req.headers['user-agent'] || 'Google OAuth Login',
                ip_address: req.ip || 'Unknown'
            }
        });

        res.cookie('refresh_token', refreshToken, getCookieOptions());

        res.status(200).json({
            success: true,
            message: "Login via Google berhasil",
            data: { access_token: accessToken, role: user.role, name: user.name }
        });

    } catch (error) {
        console.error("Google Login Error:", error);
        res.status(500).json({ success: false, error: "Terjadi kesalahan saat memverifikasi Google Login." });
    }
};

//* FUNGSI RESET PASSWORD
//* ==========================================
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ success: false, error: "Email wajib diisi." });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            res.status(200).json({ 
                success: true, 
                message: "Jika email terdaftar, tautan reset telah dikirim ke kotak masuk Anda." 
            });
            return;
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        
        const expiredAt = new Date();
        expiredAt.setMinutes(expiredAt.getMinutes() + 15);

        await prisma.passwordReset.create({
            data: {
                user_id: user.id,
                token_hash: hashedToken,
                expired_at: expiredAt,
            }
        });

        await sendPasswordResetEmail(user.email, rawToken, user.name);

        res.status(200).json({ 
            success: true, 
            message: "Jika email terdaftar, tautan reset telah dikirim ke kotak masuk Anda." 
        });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ success: false, error: "Terjadi kesalahan pada server." });
    }
};

//* FUNGSI EKSEKUSI RESET PASSWORD
//* ==========================================
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword || newPassword.length < 8) {
            res.status(400).json({ success: false, error: "Token tidak valid atau password minimal 8 karakter." });
            return;
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const resetRecord = await prisma.passwordReset.findFirst({
            where: {
                token_hash: hashedToken,
                used_at: null,
                expired_at: { gt: new Date() } 
            }
        });

        if (!resetRecord) {
            res.status(400).json({ success: false, error: "Tautan reset tidak valid atau telah kadaluarsa." });
            return;
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: resetRecord.user_id },
            data: { password_hash: newPasswordHash }
        });

        await prisma.passwordReset.update({
            where: { id: resetRecord.id },
            data: { used_at: new Date() }
        });

        await prisma.refreshToken.deleteMany({
            where: { user_id: resetRecord.user_id }
        });

        res.status(200).json({ 
            success: true, 
            message: "Kata sandi berhasil diatur ulang. Silakan login dengan kata sandi baru." 
        });

    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ success: false, error: "Terjadi kesalahan saat mengatur ulang kata sandi." });
    }
};

//* FUNGSI CEK VALIDITAS TOKEN RESET
//* ==========================================
export const verifyResetToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.query;

        if (!token || typeof token !== 'string') {
            res.status(400).json({ success: false, error: "Token tidak ditemukan." });
            return;
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const resetRecord = await prisma.passwordReset.findFirst({
            where: {
                token_hash: hashedToken,
                used_at: null,
                expired_at: { gt: new Date() } 
            }
        });

        if (!resetRecord) {
            // Jika token kadaluarsa, salah, atau sudah dipakai
            res.status(400).json({ success: false, error: "Tautan reset tidak valid atau telah kadaluarsa." });
            return;
        }

        res.status(200).json({ success: true, message: "Token valid." });

    } catch (error) {
        console.error("Verify Reset Token Error:", error);
        res.status(500).json({ success: false, error: "Terjadi kesalahan pada server." });
    }
};