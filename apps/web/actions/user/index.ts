'use server';

import { axiosAuth } from '@/lib/axios';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { User } from '@/types/user';

export const createUser = async (user: {
  email: string;
  name?: string;
  avatar?: string;
  timezone?: string;
}) => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await axiosAuth.post('/users', user, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  return response.data;
};

export const getUserByEmail = async (email: string): Promise<User> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  try {
    const response = await axiosAuth.get(`/users/email/${email}`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Error in getUserByEmail():', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error; // Re-throw or handle appropriately
  }
};

export const updateUser = async (
  id: string,
  user: {
    email?: string;
    name?: string | null;
    avatar?: string | null;
    timezone?: string;
  }
): Promise<User> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await axiosAuth.put(`/users/${id}`, user, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  return response.data;
};

export const deleteUser = async (id: string) => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await axiosAuth.delete(`/users/${id}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  return response.data;
};
