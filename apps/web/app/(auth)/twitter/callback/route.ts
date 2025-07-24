// (auth)/twitter/callback/route.ts
import { verifyCSRFToken } from '@/lib/csrf';
import { TwitterOAuthTokenResponse } from '@/types/twitter';
import { parse, serialize } from 'cookie';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors from X
    if (error) {
      console.error('X OAuth error:', error);
      return NextResponse.redirect(
        new URL('/login?error=oauth_error', req.url)
      );
    }

    if (!code || !state) {
      console.error('Missing code or state in query');
      return NextResponse.redirect(
        new URL('/login?error=missing_params', req.url)
      );
    }

    // Get CSRF token and code verifier from cookies
    const cookies = parse(req.headers.get('cookie') || '');
    const storedState = cookies['twitter_oauth_state'];
    const codeVerifier = cookies['twitter_oauth_code_verifier'];

    if (!verifyCSRFToken(state, storedState)) {
      console.error('CSRF token verification failed');
      return NextResponse.redirect(new URL('/login?error=csrf_error', req.url));
    }

    if (!codeVerifier) {
      console.error('Missing code_verifier in cookies');
      return NextResponse.redirect(new URL('/login?error=pkce_error', req.url));
    }

    // Check for environment variables
    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    const redirectUri = process.env.TWITTER_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      console.error('Missing X OAuth environment variables');
      return NextResponse.redirect(
        new URL('/login?error=server_config', req.url)
      );
    }

    // Prepare request body for token exchange
    const tokenRequestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      client_id: clientId, // Always include client_id in body
    });

    // Prepare headers - use Basic auth if client_secret is available (confidential client)
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    // For confidential clients, use Basic Authentication with client credentials
    if (clientSecret) {
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
        'base64'
      );
      headers['Authorization'] = `Basic ${credentials}`;
    }

    // Exchange authorization code for access token using correct X API endpoint
    const tokenResponse = await fetch('https://api.x.com/2/oauth2/token', {
      method: 'POST',
      headers,
      body: tokenRequestBody.toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', tokenResponse.status, errorData);
      return NextResponse.redirect(
        new URL('/login?error=token_error', req.url)
      );
    }

    const tokens: TwitterOAuthTokenResponse = await tokenResponse.json();

    // Store tokens securely (in DB, encrypted cookies, etc.)
    console.log('Access token received:', tokens);
    if (tokens.refresh_token) {
      console.log('Refresh token received (offline.access scope was used)');
    }

    // Clear the OAuth cookies
    const response = NextResponse.redirect(
      new URL('/dashboard?success=twitter_connected', req.url)
    );

    response.headers.set(
      'Set-Cookie',
      serialize('twitter_oauth_state', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      })
    );

    response.headers.append(
      'Set-Cookie',
      serialize('twitter_oauth_code_verifier', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      })
    );

    return response;
  } catch (err) {
    console.error('Error in X callback:', err);
    return NextResponse.redirect(
      new URL('/login?error=callback_error', req.url)
    );
  }
}
