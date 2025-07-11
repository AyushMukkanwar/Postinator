'use client';

import { useState, useEffect } from 'react';
import { User, Linkedin, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUserStore } from '@/store/userStore';
import { updateUser } from '@/actions/user';

const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, setUser } = useUserStore();

  useEffect(() => {
    if (user && (!user.name || !user.timezone)) {
      setIsOpen(true);
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const updatedUser = await updateUser(user);
      setUser(updatedUser);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to save user info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-[425px] border-2 border-gradient-to-r from-yellow-400/20 to-orange-500/20"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 text-xl">
            Welcome to Social Media Dashboard!
          </DialogTitle>
          <DialogDescription>
            Let&apos;s get you set up. You can always change these settings
            later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="onboarding-username">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="onboarding-username"
                placeholder="Enter your username"
                value={user.name ?? ''}
                onChange={(e) => setUser({ name: e.target.value })}
                className="pl-10 focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="onboarding-timezone">Timezone</Label>
            <Select
              value={user.timezone}
              onValueChange={(value) => setUser({ timezone: value })}
            >
              <SelectTrigger className="focus:ring-2 focus:ring-orange-400">
                <SelectValue placeholder="Select your timezone" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Platform Access</Label>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
                <div className="flex items-center space-x-2">
                  <Linkedin className="h-4 w-4 text-blue-600" />
                  <Label htmlFor="onboarding-linkedin">LinkedIn</Label>
                </div>
                <Switch
                  id="onboarding-linkedin"
                  disabled
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-r from-blue-50 to-slate-100 dark:from-slate-950/20 dark:to-slate-900/20">
                <div className="flex items-center space-x-2">
                  <Twitter className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                  <Label htmlFor="onboarding-x">X (Twitter)</Label>
                </div>
                <Switch
                  id="onboarding-x"
                  disabled
                  className="data-[state=checked]:bg-slate-700"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="flex-1 hover:bg-gradient-to-r hover:from-yellow-400/10 hover:to-orange-500/10 bg-transparent"
            disabled={isLoading}
          >
            Skip for now
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-medium shadow-lg"
            disabled={isLoading || !user.name || !user.timezone}
          >
            {isLoading ? 'Setting up...' : 'Get Started'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
