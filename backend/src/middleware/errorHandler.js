import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export function notFound(_req, res) {
  res.status(404).json({ error: 'Route not found' });
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.message,
      code: err.code
    });
  }
  logger.error('unhandled', { error: err.message, stack: err.stack });
  if (err.message?.includes('OPENROUTER_API_KEY')) {
    return res.status(500).json({ error: err.message, code: 'CONFIG_ERROR' });
  }
  res.status(500).json({ error: 'Something went wrong on our end. Please try again.' });
}
