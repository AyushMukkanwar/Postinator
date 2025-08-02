'use server';

import { axiosAuth } from '@/lib/axios';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { User } from '@/types/user';

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
