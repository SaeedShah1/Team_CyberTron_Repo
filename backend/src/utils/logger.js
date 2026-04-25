import fs from 'fs';
import path from 'path';
import { config } from '../config/config.js';

// Ensure log directory exists
const logDir = path.dirname(config.logFile);
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

function write(level, message, meta) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    message,
    ...meta
  });
  // Mirror to console
  const colors = { INFO: '\x1b[36m', WARN: '\x1b[33m', ERROR: '\x1b[31m' };
  const c = colors[level] || '';
  console.log(`${c}[${level.padEnd(5)}]\x1b[0m ${message}`, meta || '');
  // Append to log file (best-effort, don't crash on log failure)
  fs.appendFile(config.logFile, line + '\n', (err) => {
    if (err) console.error('[LOG ] write failed:', err.message);
  });
}

export const logger = {
  info:  (msg, meta) => write('INFO',  msg, meta),
  warn:  (msg, meta) => write('WARN',  msg, meta),
  error: (msg, meta) => write('ERROR', msg, meta)
};
