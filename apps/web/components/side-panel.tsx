'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, User, Linkedin, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useTheme } from 'next-themes';
import { logout } from '@/app/(auth)/actions';
import { useUserStore } from '@/store/userStore';
import { updateUser } from '@/actions/user';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SidePanel({ isOpen, onClose }: SidePanelProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user, setUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const updatedUser = await updateUser(user);
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to save user info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || !user) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            Settings
          </SheetTitle>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Theme Toggle */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Theme</Label>
            <div className="flex items-center space-x-2 p-3 rounded-lg border bg-gradient-to-r from-yellow-400/5 to-orange-500/5">
              <Sun className="h-4 w-4 text-yellow-500" />
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) =>
                  setTheme(checked ? 'dark' : 'light')
                }
              />
              <Moon className="h-4 w-4 text-blue-400" />
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-4">
            <Label className="text-base font-medium">User Information</Label>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="Enter username"
                  value={user.name ?? ''}
                  onChange={(e) =>
                    setUser({
                      name: e.target.value,
                    })
                  }
                  className="pl-10 focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                placeholder="e.g., America/New_York"
                value={user.timezone}
                onChange={(e) =>
                  setUser({
                    timezone: e.target.value,
                  })
                }
                className="focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          {/* Platform Access */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Platform Access</Label>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
                <div className="flex items-center space-x-2">
                  <Linkedin className="h-4 w-4 text-blue-600" />
                  <Label htmlFor="linkedin">LinkedIn</Label>
                </div>
                <Switch
                  id="linkedin"
                  disabled
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-r from-blue-50 to-slate-100 dark:from-slate-950/20 dark:to-slate-900/20">
                <div className="flex items-center space-x-2">
                  <Twitter className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                  <Label htmlFor="x">X (Twitter)</Label>
                </div>
                <Switch
                  id="x"
                  disabled
                  className="data-[state=checked]:bg-slate-700"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-medium shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>

          <form action={logout}>
            <Button
              type="submit"
              variant="outline"
              className="w-full mt-4 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              Logout
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
