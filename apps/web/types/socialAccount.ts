export const Platforms = ['LINKEDIN', 'TWITTER', 'INSTAGRAM'] as const;

export type Platform = (typeof Platforms)[number];

export const getPlatformDisplayName = (platform: Platform): string => {
  const displayNames: Record<Platform, string> = {
    LINKEDIN: 'LinkedIn',
    TWITTER: 'X',
    INSTAGRAM: 'Instagram',
  };
  return displayNames[platform];
};

export interface SocialAccount {
  id: string;
  platform: Platform;
  platformId: string;
  username: string;
  displayName?: string | null;
  avatar?: string | null;
  isActive: boolean;
  userId: string;
}
