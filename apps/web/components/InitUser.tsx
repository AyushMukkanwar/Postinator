'use client';

import { useEffect } from 'react';
import { getUserByEmail } from '@/actions/user';
import { useUserStore } from '@/store/userStore';
import { User } from '@/types/user';
import { checkAuth } from '@/app/(auth)/actions';

export default function InitUser() {
  const { setUser } = useUserStore();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const email = (await checkAuth()).email;
        if (!email) return;

        const user: User = await getUserByEmail(email);
        setUser(user);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUser();
  }, [setUser]);

  return null;
}
