import { authenticatedGet } from '@/lib/auth/auth-fetch';
import { serialize } from 'cookie';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const response = await authenticatedGet(
      '/social-account/linkedin/auth-url'
    );

    if (!response.ok) {
      const body = await response.text();
      console.error(`Backend failed with status ${response.status}: ${body}`);
      throw new Error(`Failed to get auth url: ${response.status} ${body}`);
    }

    const { url, state } = await response.json();

    if (!url || !url.startsWith('http') || !state) {
      throw new Error('Invalid response from backend');
    }

    const res = NextResponse.redirect(url);

    res.headers.set(
      'Set-Cookie',
      serialize('linkedin_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutes
        path: '/',
      })
    );

    return res;
  } catch (error) {
    console.error('LinkedIn auth error:', error);
    return NextResponse.redirect(new URL('/login?error=true', request.url));
  }
}
