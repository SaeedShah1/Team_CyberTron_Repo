import crypto from 'crypto';
import { config } from '../config/config.js';
import { SessionExpiredError } from '../utils/errors.js';

/**
 * In-memory session store. Single-process only (matches our JSON-DB design).
 *
 * Each session holds:
 *   - userId
 *   - createdAt
 *   - lastActivityAt
 *   - flowState  (the chatbot's per-conversation FSM state)
 */
const sessions = new Map();

export function createSession(userId) {
  const token = crypto.randomBytes(24).toString('hex');
  const now = Date.now();
  sessions.set(token, {
    userId,
    createdAt: now,
    lastActivityAt: now,
    conversationHistory: []   // Gemini content history array
  });
  return token;
}

export function destroySession(token) {
  sessions.delete(token);
}

/** Lookup + auto-expire idle sessions */
export function getSession(token) {
  if (!token) throw new SessionExpiredError();
  const s = sessions.get(token);
  if (!s) throw new SessionExpiredError();

  if (Date.now() - s.lastActivityAt > config.sessionTimeoutMs) {
    sessions.delete(token);
    throw new SessionExpiredError();
  }

  s.lastActivityAt = Date.now();
  return s;
}

/** How much idle time remains (ms) — used by client banner */
export function getRemainingMs(token) {
  const s = sessions.get(token);
  if (!s) return 0;
  const remaining = config.sessionTimeoutMs - (Date.now() - s.lastActivityAt);
  return Math.max(0, remaining);
}

/** Replace the Gemini conversation history (used by chat handlers) */
export function setConversationHistory(token, history) {
  const s = sessions.get(token);
  if (s) s.conversationHistory = history;
}

/** Legacy alias kept so old imports don't crash during transition */
export function setFlowState(token, _flowState) {
  /* no-op — replaced by setConversationHistory */
}

// Periodic sweep — drop expired sessions every minute
setInterval(() => {
  const now = Date.now();
  for (const [token, s] of sessions) {
    if (now - s.lastActivityAt > config.sessionTimeoutMs) sessions.delete(token);
  }
}, 60_000).unref?.();
