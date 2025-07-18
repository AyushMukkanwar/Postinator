'use client';

import { logout } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  return (
    <form action={logout}>
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
