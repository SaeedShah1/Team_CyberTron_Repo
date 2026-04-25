import { getSession, getRemainingMs } from '../auth/sessions.js';

/**
 * Reads "Authorization: Bearer <token>" or "X-Session-Token: <token>".
 * Throws SessionExpiredError if missing/invalid/idle-too-long.
 * Attaches req.session and req.sessionToken on success.
 */
export function requireSession(req, _res, next) {
  const auth = req.headers.authorization || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const token = bearer || req.headers['x-session-token'] || null;

  // getSession throws SessionExpiredError → caught by errorHandler
  const session = getSession(token);
  req.session = session;
  req.sessionToken = token;
  req.sessionRemainingMs = getRemainingMs(token);
  next();
}
