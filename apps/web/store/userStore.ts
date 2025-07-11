'use client';

import { create } from 'zustand';
import type { User } from '@/types/user';

type UserState = {
  user: User | null;
  getUser: () => User | null;
  setUser: (user: Partial<User>) => void;
  deleteUser: () => void;
};

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  getUser: () => get().user,
  setUser: (user) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...user } : null,
    })),
  deleteUser: () => set({ user: null }),
}));
