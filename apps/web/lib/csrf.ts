import crypto from 'crypto';

export function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function verifyCSRFToken(token?: string, storedToken?: string) {
  return token && storedToken && token === storedToken;
}
