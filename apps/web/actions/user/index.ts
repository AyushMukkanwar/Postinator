'use server';

import { UpdateUserDto } from '@/lib/api/model/updateUserDto';
import { UserEntity } from '@/lib/api/model/userEntity';
import {
  userControllerDeleteUser,
  userControllerGetUserWithSocialAccounts,
  userControllerUpdateUser,
} from '@/lib/api/users/users';
import { getCurrentUserId, isAuthenticated } from '@/lib/auth/auth-fetch';
import { User } from '@/types/user';
import { SubscriptionTier } from '@repo/database';

const mapUserEntityToUser = (entity: UserEntity): User => {
  return {
    ...entity,
    supabaseId: '', // Not returned by API yet, default to empty
    subscriptionTier: SubscriptionTier.FREE, // Not returned by API yet, default to FREE
    createdAt: new Date(entity.createdAt), // Convert string to Date
    updatedAt: new Date(entity.updatedAt), // Convert string to Date
    // Map social accounts and posts if necessary, assuming structural compatibility for now or empty
    socialAccounts: entity.socialAccounts as any,
    posts: entity.posts as any,
  };
};

export const getUser = async (): Promise<User | null> => {
  try {
    if (!(await isAuthenticated())) {
      return null;
    }
    const userId = await getCurrentUserId();
    // Use generated client
    const userEntity = await userControllerGetUserWithSocialAccounts(userId);
    return mapUserEntityToUser(userEntity);
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
  // Fix types for UpdateUserDto: converts null to undefined
  const dto: UpdateUserDto = {
    email: user.email,
    name: user.name ?? undefined,
    avatar: user.avatar ?? undefined,
    timezone: user.timezone,
  };

  // Use generated client
  const userEntity = await userControllerUpdateUser(id, dto);
  return mapUserEntityToUser(userEntity);
};

export const deleteUser = async (id: string) => {
  // Use generated client
  return await userControllerDeleteUser(id);
};
