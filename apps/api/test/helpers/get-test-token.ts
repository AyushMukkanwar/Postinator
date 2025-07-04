import * as jwt from 'jsonwebtoken';

/**
 * Generates a JWT token for use in E2E tests, simulating an authenticated Supabase user.
 */
export function getTestAccessToken(email?: string) {
  const payload = {
    sub: 'test-user-id',
    email: email || 'test@example.com',
  };
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error('SUPABASE_JWT_SECRET is not defined in the environment');
  }

  return jwt.sign(payload, secret, {
    expiresIn: '1h',
  });
}
