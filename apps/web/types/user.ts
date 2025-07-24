import type { SocialAccount } from './socialAccount';
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
  socialAccounts?: SocialAccount[];
  posts?: Post[];
}
