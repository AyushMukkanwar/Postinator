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

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      console.log('Response not OK, attempting to parse error data...');
      const errorData = await response.json();
      console.log('Error data:', errorData);
      return {
        error: errorData.message || 'Failed to create post.',
      };
    }

    console.log('Response OK, attempting to parse success data...');
    const data = await response.json();
    console.log('Success data:', data);
    return { data };
  } catch (error) {
    console.error('Error in createPost action:', error);
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
