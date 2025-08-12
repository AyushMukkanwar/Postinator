'use client';

import { create } from 'zustand';
import type { User } from '@/types/user';
import { SocialAccount } from '@/types/socialAccount';

type UserState = {
  user: User | null;
  getUser: () => User | null;
  setUser: (user: Partial<User>) => void;
  deleteUser: () => void;
  addOrUpdateSocialAccount: (socialAccount: SocialAccount) => void;
};

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  getUser: () => get().user,
  setUser: (user) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...user } : (user as User),
    })),
  deleteUser: () => set({ user: null }),
  addOrUpdateSocialAccount: (socialAccount) =>
    set((state) => {
      if (!state.user) return {};

      const existingAccounts = state.user.socialAccounts || [];
      const newAccounts = existingAccounts.filter(
        (sa) => sa.platform !== socialAccount.platform
      );
      newAccounts.push(socialAccount);

      return {
        user: {
          ...state.user,
          socialAccounts: newAccounts,
        },
      };
    }),
}));
