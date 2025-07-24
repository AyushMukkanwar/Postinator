import * as jwt from 'jsonwebtoken';

export function getTestAccessToken(userId: string | null, email?: string) {
  const payload = {
    sub: userId, // Use the actual user ID, not hardcoded 'test-user-id'
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
