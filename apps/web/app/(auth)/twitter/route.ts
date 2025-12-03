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

    const { oauth_token, oauth_token_secret, oauth_callback_confirmed } =
      await response.json();

    if (!oauth_callback_confirmed) {
      throw new Error('OAuth callback not confirmed');
    }

    const authUrl = `https://api.twitter.com/oauth/authorize?oauth_token=${oauth_token}`;

    const res = NextResponse.redirect(authUrl);

    res.headers.set(
      'Set-Cookie',
      serialize('twitter_oauth_token_secret', oauth_token_secret, {
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
