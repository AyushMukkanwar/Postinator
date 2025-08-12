'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/store/userStore';
import { getUser } from '@/actions/user';

export default function InitUser() {
  const { setUser } = useUserStore();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getUser();
        console.log('User = ', user);
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
