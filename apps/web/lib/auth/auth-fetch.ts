// lib/auth/server-fetch.ts
import { createSupabaseServerClient } from '@/lib/supabase/server';

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
/**
 * Check if user is authenticated (useful for middleware, route guards, etc.)
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return !!session;
  } catch {
    return false;
  }
}

/**
 * Get the current user ID from the backend
 */
export async function getCurrentUserId(): Promise<string> {
  try {
    const response = await authenticatedGet('/users/me');
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    const user = await response.json();
    return user.id;
  } catch (error) {
    console.error('getCurrentUserId failed:', error);
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
  const baseUrl =
    process.env.API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL;
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  try {
    // Step 1: Get Supabase session
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new AuthenticationError('No valid Supabase session found');
    }

    // Step 2: Make the request with the Supabase JWT
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('Authorization', `Bearer ${session.access_token}`);

    const response = await fetch(fullUrl, {
      ...options,
      headers: headers,
    });

    // Step 3: Handle token expiry (401 responses)
    if (response.status === 401) {
      const body = await response.text();
      console.error('authenticatedFetch: 401 Unauthorized');
      console.error('URL:', fullUrl);
      console.error('Token present:', !!session.access_token);
      console.error('Response body:', body);
      // Supabase client handles refresh automatically usually, but if we get 401 here,
      // it means the token we got is invalid/expired and Supabase didn't refresh it yet?
      // Or the backend rejected it.
      throw new AuthenticationError(`Authentication failed: ${body}`);
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
