import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config/config.js';
import { logger } from './utils/logger.js';
import { ensureDb } from './data/repository.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(express.json({ limit: '128kb' }));
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || !config.allowedOrigins.length || config.allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    cb(new Error('CORS: origin not allowed'));
  }
}));

app.use('/api/', rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false }));

app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await ensureDb();
    app.listen(config.port, () => {
      logger.info(`BanklifyAi backend listening on :${config.port}`, {
        env: config.nodeEnv,
        sessionTimeoutMin: config.sessionTimeoutMs / 60_000,
        database: config.sql.database
      });
    });
  } catch (err) {
    logger.error('Boot failed', { error: err.message });
    process.exit(1);
  }
}

process.on('SIGINT',  () => { logger.info('SIGINT received');  process.exit(0); });
process.on('SIGTERM', () => { logger.info('SIGTERM received'); process.exit(0); });

start();
