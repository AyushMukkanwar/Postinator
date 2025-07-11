'use client';

import { create } from 'zustand';
import type { SocialAccount } from '@/types/socialAccount';

type SocialAccountState = {
  socialAccounts: SocialAccount[];
  createSocialAccount: (account: SocialAccount) => void;
  readSocialAccounts: () => SocialAccount[];
  updateSocialAccount: (account: SocialAccount) => void;
  deleteSocialAccount: (accountId: string) => void;
};

export const useSocialAccountStore = create<SocialAccountState>((set, get) => ({
  socialAccounts: [],
  createSocialAccount: (account) =>
    set((state) => ({
      socialAccounts: [...state.socialAccounts, account],
    })),
  readSocialAccounts: () => get().socialAccounts,
  updateSocialAccount: (account) =>
    set((state) => ({
      socialAccounts: state.socialAccounts.map((a) =>
        a.id === account.id ? account : a
      ),
    })),
  deleteSocialAccount: (accountId) =>
    set((state) => ({
      socialAccounts: state.socialAccounts.filter(
        (account) => account.id !== accountId
      ),
    })),
}));
