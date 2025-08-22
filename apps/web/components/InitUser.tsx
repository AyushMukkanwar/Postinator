'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/store/userStore';
import { getUser } from '@/actions/user';

export default function InitUser() {
  const { setUser, setLoading } = useUserStore();

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true); // Set loading to true before fetching
      try {
        const user = await getUser();
        console.log('User = ', user);
        if (user) {
          setUser(user);
        } else {
          setLoading(false); // Set loading to false if user is not found
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setLoading(false); // Set loading to false on error
      }
    };

    fetchUser();
  }, [setUser, setLoading]);

  return null;
}
