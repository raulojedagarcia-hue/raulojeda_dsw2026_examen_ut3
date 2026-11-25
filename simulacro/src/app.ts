import express from 'express';
import type { Application } from 'express';

import { documentsRouter } from './routes/documents.js'; // ← NUEVO
import { healthRouter } from './routes/health.js';
import { questionsRouter } from './routes/questions.js';
import { noticesRouter } from './routes/notices.js'; // ← NUEVO
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { requestId } from './middlewares/requestId.js';
import { logger } from './middlewares/logger.js';

export function createApp(): Application {
  const app = express();

  app.use(requestId);        // 1) asigna un requestId a la petición (el primero: todos los demás lo usan)
  app.use(logger);
  app.use(express.json()); // antes de las rutas: si no, req.body es undefined

  app.use('/health', healthRouter);
  app.use('/api/v1/admin/documents', documentsRouter); // ← NUEVO
  app.use('/api/v1/admin/notices', noticesRouter); // ← NUEVO
  app.use('/api/v1/questions', questionsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
