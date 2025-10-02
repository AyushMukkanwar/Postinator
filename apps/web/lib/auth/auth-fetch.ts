// lib/auth/server-fetch.ts
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { jwtDecode } from 'jwt-decode';

interface AuthenticatedFetchOptions extends RequestInit {
  // Add any additional options you need
}

interface TokenResponse {
  token: string;
}

class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Convenience method for authenticated GET requests
 */
export async function authenticatedGet(
  url: string,
  options?: Omit<AuthenticatedFetchOptions, 'method'>
) {
  return authenticatedFetch(url, { ...options, method: 'GET' });
}

/**
 * Convenience method for authenticated POST requests
 */
export async function authenticatedPost(
  url: string,
  body?: any,
  options?: Omit<AuthenticatedFetchOptions, 'method' | 'body'>
) {
  return authenticatedFetch(url, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience method for authenticated PUT requests
 */
export async function authenticatedPut(
  url: string,
  body?: any,
  options?: Omit<AuthenticatedFetchOptions, 'method' | 'body'>
) {
  return authenticatedFetch(url, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience method for authenticated PATCH requests
 */
export async function authenticatedPatch(
  url: string,
  body?: any,
  options?: Omit<AuthenticatedFetchOptions, 'method' | 'body'>
) {
  return authenticatedFetch(url, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience method for authenticated DELETE requests
 */
export async function authenticatedDelete(
  url: string,
  options?: Omit<AuthenticatedFetchOptions, 'method'>
) {
  return authenticatedFetch(url, { ...options, method: 'DELETE' });
}

/**
 * Check if user is authenticated (useful for middleware, route guards, etc.)
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    (await getCustomJwt()) || (await exchangeTokenForCustomJwt());
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the current user ID from the JWT token
 */
export async function getCurrentUserId(): Promise<string> {
  try {
    let customJwt = await getCustomJwt();

    if (!customJwt) {
      customJwt = await exchangeTokenForCustomJwt();
    }

    const decoded = jwtDecode<{ userId: string; sub: string }>(customJwt);
    return decoded.userId || decoded.sub;
  } catch (error) {
    throw new AuthenticationError('Unable to determine current user');
  }
}

/**
 * Server-side authenticated fetch that automatically handles JWT token management
 */
export async function authenticatedFetch(
  url: string,
  options: AuthenticatedFetchOptions = {}
): Promise<Response> {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  try {
    // Step 1: Try to get existing custom JWT
    let customJwt = await getCustomJwt();

    // Step 2: If no valid JWT, try to get one via token exchange
    if (!customJwt) {
      customJwt = await exchangeTokenForCustomJwt();
    }

    // Step 3: Make the request with the custom JWT
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('Authorization', `Bearer ${customJwt}`);

    const response = await fetch(fullUrl, {
      ...options,
      headers: headers,
    });

    // Step 4: Handle token expiry (401 responses)
    if (response.status === 401) {
      // Clear the invalid token
      await clearCustomJwt();

      // Try to refresh token
      customJwt = await exchangeTokenForCustomJwt();

      if (!customJwt) {
        throw new AuthenticationError('Failed to refresh authentication token');
      }

      // Retry the request with new token
      headers.set('Authorization', `Bearer ${customJwt}`);
      const retryResponse = await fetch(fullUrl, {
        ...options,
        headers: headers,
      });

      return retryResponse;
    }

    return response;
  } catch (error) {
    console.error('authenticatedFetch: Error during fetch:', error);
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new Error(
      `Authenticated fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get existing custom JWT from httpOnly cookie
 */
async function getCustomJwt(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const customJwt = cookieStore.get('access_token')?.value;

    if (!customJwt) {
      return null;
    }

    // Verify token is not expired (with some buffer)
    try {
      const decoded = jwtDecode<{ exp: number }>(customJwt);
      const bufferTime = 60; // 60 seconds buffer
      const isExpired = decoded.exp * 1000 <= Date.now() + bufferTime * 1000;

      if (isExpired) {
        await clearCustomJwt();
        return null;
      }

      return customJwt;
    } catch (decodeError) {
      await clearCustomJwt();
      return null;
    }
  } catch (error) {
    console.error('Error reading custom JWT:', error);
    return null;
  }
}

/**
 * Clear the custom JWT cookie
 */
async function clearCustomJwt(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set('access_token', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
  } catch (error) {
    console.error('Error clearing custom JWT:', error);
  }
}

/**
 * Exchange Supabase token for custom JWT via your backend
 */
async function exchangeTokenForCustomJwt(): Promise<string> {
  try {
    // Get Supabase session
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.access_token) {
      throw new AuthenticationError('No valid Supabase session found');
    }

    // Exchange Supabase token for custom JWT
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/auth/exchange-token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ supabaseToken: session.access_token }),
        credentials: 'include', // Important: This ensures cookies are sent/received
      }
    );

    if (!response.ok) {
      console.error(
        'Token exchange failed:',
        response.status,
        response.statusText
      );
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError('Supabase token is invalid or expired');
      }
      throw new Error(
        `Token exchange failed: ${response.status} ${response.statusText}`
      );
    }

    const data: TokenResponse = await response.json();

    if (!data.token) {
      throw new Error('No access token received from exchange endpoint');
    }

    // Manually set the cookie on the response to the browser
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      try {
        const cookieStore = await cookies();
        // Basic parsing, assumes one cookie is being set
        const [cookiePair, ...directives] = setCookieHeader
          .split(';')
          .map((s) => s.trim());
        const [name, value] = cookiePair.split('=');

        const options: any = {};
        for (const directive of directives) {
          let [key, val] = directive.split('=');
          key = key.toLowerCase();
          if (val) val = val.trim();

          if (key === 'expires') options.expires = new Date(val);
          else if (key === 'max-age') options.maxAge = parseInt(val, 10);
          else if (key === 'domain') options.domain = val;
          else if (key === 'path') options.path = val;
          else if (key === 'samesite')
            options.sameSite = val.toLowerCase() as 'strict' | 'lax' | 'none';
          else if (key === 'secure') options.secure = true;
          else if (key === 'httponly') options.httpOnly = true;
        }

        if (name && value) {
          cookieStore.set(name, value, options);
        }
      } catch (e) {
        // Ignore errors in server components
      }
    }

    // The httpOnly cookie should now be set automatically by your NestJS backend
    // Return the token for immediate use
    return data.token;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    console.error('Token exchange failed:', error);
    throw new AuthenticationError('Failed to obtain authentication token');
  }
}
