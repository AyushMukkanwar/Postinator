import { updateSocialAccount } from '@/actions/social-account';
import { useUserStore } from '@/store/userStore';
import { getPlatformDisplayName, Platforms } from '@/types/socialAccount';

import { getPlatformIcon } from './platform-icon';
import { BaseToggle } from './base-toggle';
import { Label } from './ui/label';

export function PlatformAccess() {
  const { user, addOrUpdateSocialAccount } = useUserStore();
  const socialAccounts = user?.socialAccounts || [];

  if (!user) return null;

  const isTokenExpired = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const handleToggle = async (platform: (typeof Platforms)[number]) => {
    const account = socialAccounts.find((acc) => acc.platform === platform);

    if (account && !isTokenExpired(account.expiresAt)) {
      // Toggle active state
      const updatedAccount = await updateSocialAccount(account.id, {
        isActive: !account.isActive,
      });
      addOrUpdateSocialAccount(updatedAccount);
    } else {
      // Initiate OAuth flow
      if (platform === 'TWITTER') {
        window.location.href = '/twitter';
      } else {
        // Handle other platform toggle logic here
        console.log(`Toggle ${platform}`);
      }
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Platform Access</Label>
      <div className="space-y-3">
        {Platforms.map((platform) => {
          const account = socialAccounts.find(
            (acc) => acc.platform === platform
          );
          const expired = isTokenExpired(account?.expiresAt);
          return (
            <BaseToggle
              key={platform}
              label={getPlatformDisplayName(platform)}
              checked={account?.isActive || false}
              onCheckedChange={() => handleToggle(platform)}
              icon={getPlatformIcon(platform)}
              id={platform.toLowerCase()}
              disabled={!account && expired}
            />
          );
        })}
      </div>
    </div>
  );
}
