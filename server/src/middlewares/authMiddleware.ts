import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_ACCESS_SECRET } from '../utils/env.js';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

//* Verifikasi JWT
//* ==========================================
export const verifyJWT = (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    const authHeader = authReq.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: 'Akses ditolak. Token tidak ditemukan.' });
        return;
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
        res.status(401).json({ success: false, error: 'Format token tidak valid.' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as unknown as { id: string; email: string; role: string };
        authReq.user = decoded;
        next();
    } catch {
        res.status(403).json({ success: false, error: 'Token tidak valid atau sudah kadaluarsa.' });
    }
};

//* MEMERIKSA HAK AKSES
//* ==========================================
export const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const authReq = req as AuthRequest;
        if (!authReq.user || !roles.includes(authReq.user.role)) {
            res.status(403).json({ 
                success: false, 
                error: 'Akses ditolak. Anda tidak memiliki izin (Role) untuk area ini.' 
            });
            return;
        }
        next();
    };
};