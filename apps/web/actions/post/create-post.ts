'use server';

import { authenticatedPost } from '@/lib/auth/auth-fetch';
import { Platform } from '@/types/socialAccount';

interface PostData {
  content: string;
  scheduledFor: string;
  platform: Platform;
  socialAccountId: string;
}

export async function createPost(postData: PostData) {
  try {
    const response = await authenticatedPost('/post', {
      content: postData.content,
      scheduledFor: postData.scheduledFor,
      platform: postData.platform,
      socialAccountId: postData.socialAccountId,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        error: errorData.message || 'Failed to create post.',
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
