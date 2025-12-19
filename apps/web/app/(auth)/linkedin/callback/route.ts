// (auth)/linkedin/callback/route.ts
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
      throw new Error(`LinkedIn auth error: ${error}`);
    }

    if (!code || !state) {
      throw new Error('Missing code or state');
    }

    const cookies = parse(req.headers.get('cookie') || '');
    const storedState = cookies['linkedin_state'];

    if (!storedState || state !== storedState) {
      throw new Error('State mismatch');
    }

    const response = await authenticatedPost(
      '/social-account/linkedin/access-token',
      {
        code,
        redirectUri: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/linkedin/callback`,
      }
    );

    if (!response.ok) {
      const body = await response.text();
      console.error(`Backend failed with status ${response.status}: ${body}`);
      throw new Error(`Failed to get access token: ${response.status} ${body}`);
    }

    const redirectUrl = new URL(
      '/dashboard?success=linkedin_connected',
      req.url
    );

    const res = NextResponse.redirect(redirectUrl);

    // Clear cookies
    res.headers.set(
      'Set-Cookie',
      serialize('linkedin_state', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      })
    );

    return res;
  } catch (err) {
    console.error('LinkedIn callback error:', err);
    return NextResponse.redirect(
      new URL('/login?error=callback_error', req.url)
    );
  }
}
