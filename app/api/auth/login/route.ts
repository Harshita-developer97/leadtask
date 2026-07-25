import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { userRepository } from '@/repositories/user.repository';
import { loginSchema } from '@/lib/validators/auth';
import { ok, unauthorized, withErrorHandling } from '@/lib/api-response';
import { logger } from '@/lib/logger';

/**
 * NOTE on this endpoint vs. the login form:
 * Session *cookies* in Auth.js are issued through its own signed callback
 * route (`/api/auth/callback/credentials`), which the login page calls via
 * the `signIn()` client helper — that's what actually logs a browser in.
 * This endpoint exists to satisfy the REST contract required by the task
 * spec and is useful for API-only clients (mobile apps, Postman, CI smoke
 * tests) that want to validate credentials without a browser session.
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const { email, password } = loginSchema.parse(body);

  const user = await userRepository.findByEmail(email);
  if (!user) {
    logger.auth('API login failed - unknown email', { email });
    return unauthorized('Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    logger.auth('API login failed - bad password', { userId: user.id });
    return unauthorized('Invalid email or password');
  }

  logger.auth('API login validated', { userId: user.id });
  return ok(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    'Credentials valid. Use the web login form to establish a browser session.'
  );
});
