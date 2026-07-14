import { Router } from 'express';
import multer from 'multer';
import { uploadKnowledge, getKnowledgeList, deleteKnowledge, getPendingUsers, approveUser, getFeedbackList, getAuditLogs } from '../controllers/adminController.js';
import { verifyJWT, requireRole } from '../middlewares/authMiddleware.js';

const router = Router();

// Simpan file di memori RAM sementara agar cepat diproses
const upload = multer({ storage: multer.memoryStorage() });

router.use(verifyJWT);

// Admin Status
router.get('/users/pending', requireRole(['SUPER_ADMIN']), getPendingUsers);
router.put('/users/:id/approve', requireRole(['SUPER_ADMIN']), approveUser);

// Manajemen Dokumen
router.get('/knowledge', requireRole(['ADMIN', 'SUPER_ADMIN']), getKnowledgeList);

router.post('/knowledge/upload', requireRole(['ADMIN', 'SUPER_ADMIN']), upload.single('document'), uploadKnowledge);

router.delete('/knowledge/:filename', requireRole(['ADMIN', 'SUPER_ADMIN']), deleteKnowledge);

// Feedback
router.get('/feedback', requireRole(['ADMIN', 'SUPER_ADMIN']), getFeedbackList);

// Audit
router.get('/audit', requireRole(['SUPER_ADMIN']), getAuditLogs);

export default router;