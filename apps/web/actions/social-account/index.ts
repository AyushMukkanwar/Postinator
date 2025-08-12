'use server';

import {
  authenticatedGet,
  authenticatedPost,
  authenticatedPatch,
  authenticatedDelete,
  getCurrentUserId,
} from '@/lib/auth/auth-fetch';
import { SocialAccount, Platform } from '@/types/socialAccount';

export const upsertSocialAccount = async (socialAccount: {
  platform: Platform;
  platformId: string;
  username: string;
  accessToken: string;
  refreshToken?: string;
  isActive?: boolean;
  expiresIn?: number;
}) => {
  const userId = await getCurrentUserId();
  const response = await authenticatedPost('/social-account/upsert', {
    ...socialAccount,
    userId,
  });

  if (!response.ok) {
    throw new Error('Failed to create social account');
  }

  return await response.json();
};

export const getSocialAccountById = async (
  id: string
): Promise<SocialAccount> => {
  const response = await authenticatedGet(`/social-account/${id}`);

  if (!response.ok) {
    throw new Error('Failed to get social account');
  }

  return await response.json();
};

export const updateSocialAccount = async (
  id: string,
  socialAccount: {
    username?: string;
    isActive?: boolean;
  }
): Promise<SocialAccount> => {
  const response = await authenticatedPatch(
    `/social-account/${id}`,
    socialAccount
  );

  if (!response.ok) {
    throw new Error('Failed to update social account');
  }

  return await response.json();
};

export const deleteSocialAccount = async (id: string) => {
  const response = await authenticatedDelete(`/social-account/${id}`);

  if (!response.ok) {
    throw new Error('Failed to delete social account');
  }

  return await response.json();
};

export const getSocialAccounts = async (): Promise<SocialAccount[]> => {
  const response = await authenticatedGet('/social-account/user/me');

  if (!response.ok) {
    throw new Error('Failed to get social accounts');
  }

  return await response.json();
};
