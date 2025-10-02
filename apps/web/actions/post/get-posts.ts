'use server';

import { authenticatedFetch } from '@/lib/auth/auth-fetch';

export async function getPosts(status: string) {
  try {
    const response = await authenticatedFetch(`/post?status=${status}`);

    if (!response.ok) {
      const errorData = await response.json();
      return {
        error: errorData.message || 'Failed to fetch posts.',
      };
    }
    const data = await response.json();
    return { data };
  } catch (error) {
    if (error instanceof Error) {
      return {
        error: error.message,
      };
    }
    return {
      error: 'An unknown error occurred.',
    };
  }
}
