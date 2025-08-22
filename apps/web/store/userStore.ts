'use client';

import { create } from 'zustand';
import type { User } from '@/types/user';
import { SocialAccount } from '@/types/socialAccount';

type UserState = {
  user: User | null;
  loading: boolean;
  getUser: () => User | null;
  setUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  deleteUser: () => void;
  addOrUpdateSocialAccount: (socialAccount: SocialAccount) => void;
};

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  loading: true,
  getUser: () => get().user,
  setUser: (user) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...user } : (user as User),
      loading: false,
    })),
  setLoading: (loading) => set({ loading }),
  deleteUser: () => set({ user: null, loading: false }),
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
