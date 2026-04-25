import bcrypt from 'bcryptjs';
import { findUserById } from '../data/repository.js';
import { createSession, destroySession } from './sessions.js';
import { AuthError, InvalidInputError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export async function login({ userId, password }) {
  if (!userId || !password) throw new InvalidInputError('User ID and password are required');

  const user = await findUserById(userId);
  if (!user) {
    logger.warn('login failed', { userId, reason: 'user_not_found' });
    throw new AuthError();
  }

  const ok = bcrypt.compareSync(password, user.password);
  if (!ok) {
    logger.warn('login failed', { userId, reason: 'bad_password' });
    throw new AuthError();
  }

  const token = createSession(userId);
  logger.info('login ok', { userId });

  return {
    token,
    user: {
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      accountCount: user.accounts.length
    }
  };
}

export function logout(token) {
  destroySession(token);
  logger.info('logout', { token: token?.slice(0, 8) + '…' });
}
