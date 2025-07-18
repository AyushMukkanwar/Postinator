'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { BaseToggle } from '@/components/base-toggle';
import { Label } from '@/components/ui/label';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-2">
      <Label className="text-base font-medium">Theme</Label>
      <div className="flex items-center space-x-2 p-3 rounded-lg border bg-gradient-to-r from-yellow-400/5 to-orange-500/5">
        <Sun className="h-4 w-4 text-yellow-500" />
        <BaseToggle
          label=""
          checked={theme === 'dark'}
          onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
          className="border-0 bg-transparent p-0"
        />
        <Moon className="h-4 w-4 text-blue-400" />
      </div>
    </div>
  );
}
