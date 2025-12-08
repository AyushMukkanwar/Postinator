// (auth)/twitter/callback/route.ts
import { authenticatedPost } from '@/lib/auth/auth-fetch';
import { parse, serialize } from 'cookie';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      throw new Error(`Twitter auth error: ${error}`);
    }

    if (!code || !state) {
      throw new Error('Missing code or state');
    }

    const cookies = parse(req.headers.get('cookie') || '');
    const codeVerifier = cookies['twitter_code_verifier'];
    const storedState = cookies['twitter_state'];

    if (!codeVerifier || !storedState) {
      throw new Error('Missing code_verifier or state from cookie');
    }

    if (state !== storedState) {
      throw new Error('State mismatch');
    }

    const response = await authenticatedPost(
      '/social-account/twitter/access-token',
      {
        code,
        state,
        codeVerifier,
        redirectUri: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/twitter/callback`,
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

    // Clear cookies
    res.headers.append(
      'Set-Cookie',
      serialize('twitter_code_verifier', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      })
    );
    res.headers.append(
      'Set-Cookie',
      serialize('twitter_state', '', {
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
