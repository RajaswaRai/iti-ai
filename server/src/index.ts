import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import cookieParser from 'cookie-parser';
import { PORT } from './utils/env.js';
import authRoutes from './routes/authRoutes.js';
import { verifyJWT, requireRole } from './middlewares/authMiddleware.js';

// Import Routes
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Konfigurasi Swagger Documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ITI AI Assistant API',
      version: '1.0.0',
      description: 'Dokumentasi API untuk Chatbot dan Manajemen Knowledge',
    },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  apis: ['./src/routes/*.ts', './src/docs/*.yaml'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// ==========================================
// DAFTAR ROUTES
// ==========================================
// 1. Jalur Publik (Bisa diakses Mahasiswa)
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// 2. Jalur Khusus Admin (Manajemen Dokumen)
app.use('/api/admin', verifyJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), adminRoutes);

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  console.log(`Swagger UI tersedia di http://localhost:${PORT}/api-docs`);
});