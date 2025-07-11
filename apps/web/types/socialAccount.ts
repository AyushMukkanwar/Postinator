export type Platform = 'LINKEDIN' | 'TWITTER';

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
