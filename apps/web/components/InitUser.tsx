'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/store/userStore';
import { User } from '@/types/user';
import { exchangeToken } from '@/actions/auth';

export default function InitUser() {
  const { setUser } = useUserStore();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user: User | null = await exchangeToken();
        if (user) {
          setUser(user);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUser();
  }, [setUser]);

  return null;
}
