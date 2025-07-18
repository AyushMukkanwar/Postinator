'use client';

import { useState, useEffect } from 'react';
import { User, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUserStore } from '@/store/userStore';
import { updateUser } from '@/actions/user';

// Get all available timezones
const getTimezones = () => {
  try {
    // Use Intl.supportedValuesOf if available (newer browsers)
    if ('supportedValuesOf' in Intl) {
      return Intl.supportedValuesOf('timeZone');
    }
  } catch (error) {
    // Fallback for older browsers
  }

  // Fallback list of common timezones
  return [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'America/Vancouver',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Rome',
    'Europe/Madrid',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Asia/Dubai',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Pacific/Auckland',
    'UTC',
  ];
};

export function UserProfile() {
  const { user, setUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState(user?.name ?? '');
  const [timezone, setTimezone] = useState(user?.timezone ?? '');
  const [detectedTimezone, setDetectedTimezone] = useState('');

  const timezones = getTimezones();

  useEffect(() => {
    // Detect user's current timezone
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setDetectedTimezone(detected);

    // If user doesn't have a timezone set, use the detected one
    if (!user?.timezone) {
      setTimezone(detected);
    }
  }, [user?.timezone]);

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const updatedUser = await updateUser(user.id, {
        name: username,
        timezone: timezone,
        avatar: user.avatar,
        email: user.email,
      });
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to save user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges =
    username !== (user?.name ?? '') || timezone !== (user?.timezone ?? '');

  if (!user) return null;

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">User Profile</Label>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="username"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-10 focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <div className="relative">
            <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="pl-10 focus:ring-2 focus:ring-orange-400">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {detectedTimezone && (
                  <>
                    <SelectItem value={detectedTimezone}>
                      {detectedTimezone} (Detected)
                    </SelectItem>
                    <div className="border-t my-1" />
                  </>
                )}
                {timezones
                  .filter((tz) => tz !== detectedTimezone)
                  .sort()
                  .map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-medium shadow-lg"
          disabled={isLoading || !hasChanges}
        >
          {isLoading ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </div>
  );
}
