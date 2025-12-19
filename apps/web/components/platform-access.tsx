import { updateSocialAccount } from '@/actions/social-account';
import { useUserStore } from '@/store/userStore';
import { getPlatformDisplayName, Platforms } from '@repo/database';

import { BaseToggle } from './base-toggle';
import { getPlatformIcon } from './platform-icon';
import { Label } from './ui/label';

export function PlatformAccess() {
  const { user, addOrUpdateSocialAccount } = useUserStore();
  const socialAccounts = user?.socialAccounts || [];

  if (!user) return null;

  const isTokenExpired = (expiresAt: Date | string | null | undefined) => {
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
        window.location.href = `/twitter`;
      } else if (platform === 'LINKEDIN') {
        window.location.href = `/linkedin`;
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
          // Only enable Twitter and LinkedIn for now
          const isSupported = platform === 'TWITTER' || platform === 'LINKEDIN';

          return (
            <BaseToggle
              key={platform}
              label={getPlatformDisplayName(platform)}
              checked={account?.isActive || false}
              onCheckedChange={() => handleToggle(platform)}
              icon={getPlatformIcon(platform)}
              id={platform.toLowerCase()}
              disabled={!isSupported}
            />
          );
        })}
      </div>
    </div>
  );
}
