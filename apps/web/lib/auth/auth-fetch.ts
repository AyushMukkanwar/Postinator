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
 * Server-side authenticated fetch that automatically handles JWT token management
 * Similar to your client-side axiosAuth but for server-side operations
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
    console.log(
      'authenticatedFetch: customJwt after getCustomJwt:',
      customJwt ? 'present' : 'null'
    );

    // Step 2: If no valid JWT, try to get one via token exchange
    if (!customJwt) {
      console.log('authenticatedFetch: No custom JWT, attempting exchange...');
      customJwt = await exchangeTokenForCustomJwt();
      console.log(
        'authenticatedFetch: customJwt after exchange:',
        customJwt ? 'present' : 'null'
      );
    }

    // Step 3: Make the request with the custom JWT
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('Authorization', `Bearer ${customJwt}`);

    console.log('authenticatedFetch: Making fetch request to:', fullUrl);
    console.log('authenticatedFetch: Request options:', {
      ...options,
      headers: headers,
    });

    const response = await fetch(fullUrl, {
      ...options,
      headers: headers,
    });

    console.log(
      'authenticatedFetch: Received response with status:',
      response.status
    );

    // Step 4: Handle token expiry (401 responses)
    if (response.status === 401) {
      console.log(
        'authenticatedFetch: Received 401, attempting token refresh...'
      );
      // Token might be expired, try to refresh once
      customJwt = await exchangeTokenForCustomJwt();

      // Retry the request with new token
      const retryResponse = await fetch(fullUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
          Authorization: `Bearer ${customJwt}`,
        },
      });
      console.log(
        'authenticatedFetch: Retried request status:',
        retryResponse.status
      );
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
    const customJwt = cookieStore.get('access_token')?.value; // or whatever your cookie name is

    if (!customJwt) {
      return null;
    }

    // Verify token is not expired (with some buffer)
    const decoded = jwtDecode<{ exp: number }>(customJwt);
    const bufferTime = 60; // 60 seconds buffer
    const isExpired = decoded.exp * 1000 <= Date.now() + bufferTime * 1000;

    if (isExpired) {
      console.log('Custom JWT is expired, will refresh');
      return null;
    }

    return customJwt;
  } catch (error) {
    console.error('Error reading custom JWT:', error);
    return null;
  }
}

/**
 * Exchange Supabase token for custom JWT via your backend
 */
async function exchangeTokenForCustomJwt(): Promise<string> {
  console.log(
    '********Attempting to exchange Supabase token for custom JWT********'
  );
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

    // The httpOnly cookie should be set automatically by your NestJS backend
    // We return the token in case it's needed immediately
    return data.token;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    console.error('Token exchange failed:', error);
    throw new AuthenticationError('Failed to obtain authentication token');
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
