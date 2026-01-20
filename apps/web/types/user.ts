import type { SocialAccount, SubscriptionTier } from '@repo/database';
import type { Post } from './postStatus';

export interface User {
  id: string;
  supabaseId: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
  subscriptionTier: SubscriptionTier;
  socialAccounts?: SocialAccount[];
  posts?: Post[];
}
