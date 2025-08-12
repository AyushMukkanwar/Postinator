'use server';

import {
  authenticatedGet,
  authenticatedPut,
  authenticatedDelete,
  getCurrentUserId,
} from '@/lib/auth/auth-fetch';
import { User } from '@/types/user';

export const getUser = async (): Promise<User | null> => {
  try {
    const userId = await getCurrentUserId();
    const response = await authenticatedGet(`/users/${userId}/social-accounts`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
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
  const response = await authenticatedPut(`/users/${id}`, user);
  if (!response.ok) {
    // You might want to handle this more gracefully
    throw new Error('Failed to update user');
  }
  return await response.json();
};

export const deleteUser = async (id: string) => {
  const response = await authenticatedDelete(`/users/${id}`);
  if (!response.ok) {
    // You might want to handle this more gracefully
    throw new Error('Failed to delete user');
  }
  return await response.json();
};
