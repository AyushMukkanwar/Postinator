'use server';

import { axiosAuth } from '@/lib/axios';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SocialAccount, Platform } from '@/types/socialAccount';

export const createSocialAccount = async (socialAccount: {
  platform: Platform;
  platformId: string;
  username: string;
  accessToken: string;
  isActive?: boolean;
}) => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await axiosAuth.post(
    '/social-account',
    { ...socialAccount, userId: session.user.id },
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    }
  );

  return response.data;
};

export const getSocialAccountById = async (
  id: string
): Promise<SocialAccount> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  try {
    const response = await axiosAuth.get(`/social-account/${id}`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Error in getSocialAccountById():', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

export const updateSocialAccount = async (
  id: string,
  socialAccount: {
    username?: string;
    isActive?: boolean;
  }
): Promise<SocialAccount> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await axiosAuth.patch(
    `/social-account/${id}`,
    socialAccount,
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    }
  );

  return response.data;
};

export const deleteSocialAccount = async (id: string) => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await axiosAuth.delete(`/social-account/${id}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  return response.data;
};
