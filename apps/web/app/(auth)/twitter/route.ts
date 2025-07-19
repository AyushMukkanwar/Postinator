// (auth)/twitter/route.ts
import { generateCSRFToken } from '@/lib/csrf';
import { serialize } from 'cookie';
import { NextResponse } from 'next/server';
import { generateCodeChallenge, generateCodeVerifier } from '@/lib/pkce';

export async function GET() {
  const state = generateCSRFToken();

  // Use the correct X OAuth 2.0 authorize URL
  const authUrl = new URL('https://x.com/i/oauth2/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', process.env.TWITTER_CLIENT_ID!);
  authUrl.searchParams.set('redirect_uri', process.env.TWITTER_REDIRECT_URI!);

  // Use proper scope formatting - manually encode to ensure correct format
  const scopes = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'];
  authUrl.searchParams.set('scope', scopes.join(' '));

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  const response = NextResponse.redirect(authUrl.toString());

  response.headers.set(
    'Set-Cookie',
    serialize('twitter_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    })
  );

  response.headers.append(
    'Set-Cookie',
    serialize('twitter_oauth_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    })
  );

  return response;
}
