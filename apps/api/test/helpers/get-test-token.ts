import * as jwt from 'jsonwebtoken';
// It's good practice to import the payload type to ensure consistency
import { JwtPayload } from 'src/auth/strategies/supabase.strategy';

/**
 * Generates a test JWT access token with the necessary payload.
 * @param userId - The user's internal database ID (e.g., a CUID or UUID).
 * @param supabaseId - The user's Supabase Auth ID.
 * @param email - The user's email.
 * @returns A signed JWT string.
 */
export const getTestAccessToken = (
  userId: string,
  supabaseId: string,
  email: string
): string => {
  // This payload now matches the JwtPayload interface your guards expect.
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    userId: userId,
    supabaseId: supabaseId,
    email: email,
  };

  return jwt.sign(payload, process.env.SUPABASE_JWT_SECRET!, {
    expiresIn: '1h', // Using jwt's built-in expiration option is cleaner
  });
};
