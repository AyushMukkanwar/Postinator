'use client';

import { logout } from '@/app/(auth)/actions/index';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/store/userStore';
import { usePostStore } from '@/store/postStore';

export function LogoutButton() {
  const deleteUser = useUserStore((state) => state.deleteUser);
  const setPosts = usePostStore((state) => state.setPosts);

  const handleLogout = async () => {
    deleteUser();
    setPosts([]);
    await logout();
  };

  return (
    <form action={handleLogout}>
      <Button
        type="submit"
        variant="outline"
        className="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white bg-transparent"
      >
        Logout
      </Button>
    </form>
  );
}
