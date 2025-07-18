'use client';

import { useUserStore } from '@/store/userStore';
import { getPlatformDisplayName, Platforms } from '@/types/socialAccount';

import { getPlatformIcon } from './platform-icon';
import { BaseToggle } from './base-toggle';
import { Label } from './ui/label';

export function PlatformAccess() {
  const { user } = useUserStore();
  if (!user) return null;

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Platform Access</Label>
      <div className="space-y-3">
        {Platforms.map((platform) => (
          <BaseToggle
            key={platform}
            label={getPlatformDisplayName(platform)}
            checked={
              user.socialAccounts?.some(
                (account) => account.platform === platform && account.isActive
              ) || false
            }
            onCheckedChange={() => {
              // Handle platform toggle logic here
              console.log(`Toggle ${platform}`);
            }}
            icon={getPlatformIcon(platform)}
            disabled={
              user.socialAccounts?.some(
                (account) => account.platform === platform && account.isActive
              ) || false
            }
            id={platform.toLowerCase()}
          />
        ))}
      </div>
    </div>
  );
}
