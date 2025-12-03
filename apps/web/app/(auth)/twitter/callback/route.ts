// (auth)/twitter/callback/route.ts
import { authenticatedPost } from '@/lib/auth/auth-fetch';
import { parse, serialize } from 'cookie';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const oauth_token = searchParams.get('oauth_token');
    const oauth_verifier = searchParams.get('oauth_verifier');

    if (!oauth_token || !oauth_verifier) {
      throw new Error('Missing oauth_token or oauth_verifier');
    }

    const cookies = parse(req.headers.get('cookie') || '');
    const oauth_token_secret = cookies['twitter_oauth_token_secret'];

    if (!oauth_token_secret) {
      throw new Error('Missing oauth_token_secret from cookie');
    }

    const response = await authenticatedPost(
      '/social-account/twitter/access-token',
      {
        oauth_token,
        oauth_verifier,
        oauth_token_secret,
      }
    );

    if (!response.ok) {
      const body = await response.text();
      console.error(`Backend failed with status ${response.status}: ${body}`);
      throw new Error(`Failed to get access token: ${response.status} ${body}`);
    }

    const redirectUrl = new URL(
      '/dashboard?success=twitter_connected',
      req.url
    );

    const res = NextResponse.redirect(redirectUrl);

    res.headers.set(
      'Set-Cookie',
      serialize('twitter_oauth_token_secret', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      })
    );

    return res;
  } catch (err) {
    console.error('Twitter callback error:', err);
    return NextResponse.redirect(
      new URL('/login?error=callback_error', req.url)
    );
  }
}
