import { Router } from 'express';
import { login, logout } from '../auth/authService.js';
import { requireSession } from '../middleware/requireSession.js';
import { findUserById } from '../data/repository.js';
import { config } from '../config/config.js';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const { userId, password } = req.body || {};
    const result = await login({ userId, password });
    res.json({
      ...result,
      sessionTimeoutMs: config.sessionTimeoutMs
    });
  } catch (err) { next(err); }
});

router.post('/logout', requireSession, (req, res) => {
  logout(req.sessionToken);
  res.json({ ok: true });
});

router.get('/me', requireSession, async (req, res, next) => {
  try {
    const user = await findUserById(req.session.userId);
    res.json({
      user: {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        accounts: user.accounts
      },
      sessionRemainingMs: req.sessionRemainingMs
    });
  } catch (err) { next(err); }
});

export default router;
