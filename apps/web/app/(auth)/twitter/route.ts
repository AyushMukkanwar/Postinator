// (auth)/twitter/route.ts
import { authenticatedGet } from '@/lib/auth/auth-fetch';
import { serialize } from 'cookie';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const response = await authenticatedGet(
      '/social-account/twitter/request-token'
    );

    if (!response.ok) {
      const body = await response.text();
      console.error(`Backend failed with status ${response.status}: ${body}`);
      throw new Error(
        `Failed to get request token: ${response.status} ${body}`
      );
    }

    const { url, codeVerifier, state } = await response.json();

    if (!url || !codeVerifier || !state) {
      throw new Error('Missing url, codeVerifier, or state from backend');
    }

    const res = NextResponse.redirect(url);

    res.headers.append(
      'Set-Cookie',
      serialize('twitter_code_verifier', codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutes
        path: '/',
      })
    );

    res.headers.append(
      'Set-Cookie',
      serialize('twitter_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutes
        path: '/',
      })
    );

    return res;
  } catch (error) {
    console.error('Twitter auth error:', error);
    return NextResponse.redirect(new URL('/login?error=true', request.url));
  }
}
