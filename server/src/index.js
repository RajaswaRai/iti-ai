import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import chatRoutes from './routes/chatRoutes.js';
import { PORT } from './utils/env.js';
const app = express();
app.use(cors());
app.use(express.json());
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'ITI AI Assistant API',
            version: '1.0.0',
            description: 'Dokumentasi API untuk Chatbot',
        },
        servers: [{ url: `http://localhost:${PORT}` }],
    },
    apis: ['./src/routes/*.ts', './src/docs/*.yaml'],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use('/api/chat', chatRoutes);
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    console.log(`Swagger UI tersedia di http://localhost:${PORT}/api-docs`);
});
//# sourceMappingURL=index.js.map