'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useUserStore } from '@/store/userStore';
import { UserProfile } from './user-profile';
import { ThemeToggle } from './theme-toggle';
import { PlatformAccess } from './platform-access';
import { LogoutButton } from './logout-button';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SidePanel({ isOpen, onClose }: SidePanelProps) {
  const [mounted, setMounted] = useState(false);
  const { user } = useUserStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            Settings
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 space-y-8 pr-2">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Subtle Separator */}
          <div className="border-t border-gradient-to-r from-transparent via-border to-transparent opacity-50" />

          {/* User Profile Component */}
          <UserProfile />

          {/* Subtle Separator */}
          <div className="border-t border-gradient-to-r from-transparent via-border to-transparent opacity-50" />

          {/* Platform Access */}
          <PlatformAccess />

          {/* Subtle Separator */}
          <div className="border-t border-gradient-to-r from-transparent via-border to-transparent opacity-50" />

          {/* Logout Button */}
          <LogoutButton />
        </div>
      </SheetContent>
    </Sheet>
  );
}
