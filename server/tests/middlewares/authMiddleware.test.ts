import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyJWT, requireRole, type AuthRequest } from '../../src/middlewares/authMiddleware.js';

// Mock jsonwebtoken
vi.mock('jsonwebtoken');

describe('Auth Middleware', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockRequest = {
            headers: {}
        };
        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
        mockNext = vi.fn();
        vi.clearAllMocks();
    });

    describe('verifyJWT', () => {
        it('should return 401 if no authorization header is present', () => {
            verifyJWT(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: false, error: 'Akses ditolak. Token tidak ditemukan.' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 if authorization header does not start with Bearer', () => {
            mockRequest.headers = { authorization: 'Basic some_token' };
            verifyJWT(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: false, error: 'Akses ditolak. Token tidak ditemukan.' });
        });

        it('should return 401 if token is missing after Bearer', () => {
            mockRequest.headers = { authorization: 'Bearer ' };
            verifyJWT(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: false, error: 'Format token tidak valid.' });
        });

        it('should call next and attach user if token is valid', () => {
            mockRequest.headers = { authorization: 'Bearer valid_token' };
            const decodedUser = { id: '1', email: 'test@test.com', role: 'ADMIN' };
            
            vi.mocked(jwt.verify).mockReturnValue(decodedUser as any);

            verifyJWT(mockRequest as Request, mockResponse as Response, mockNext);

            expect(jwt.verify).toHaveBeenCalledWith('valid_token', expect.any(String));
            expect(mockRequest.user).toEqual(decodedUser);
            expect(mockNext).toHaveBeenCalled();
        });

        it('should return 403 if token verification fails', () => {
            mockRequest.headers = { authorization: 'Bearer invalid_token' };
            vi.mocked(jwt.verify).mockImplementation(() => { throw new Error('Invalid token'); });

            verifyJWT(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: false, error: 'Token tidak valid atau sudah kadaluarsa.' });
        });
    });

    describe('requireRole', () => {
        it('should return 403 if user is not attached to request', () => {
            const middleware = requireRole(['ADMIN']);
            middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: false, error: 'Akses ditolak. Anda tidak memiliki izin (Role) untuk area ini.' });
        });

        it('should return 403 if user role is not in allowed roles', () => {
            mockRequest.user = { id: '1', email: 'test@test.com', role: 'USER' };
            const middleware = requireRole(['ADMIN', 'SUPER_ADMIN']);
            
            middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
        });

        it('should call next if user role is allowed', () => {
            mockRequest.user = { id: '1', email: 'test@test.com', role: 'ADMIN' };
            const middleware = requireRole(['ADMIN', 'SUPER_ADMIN']);
            
            middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
    });
});
