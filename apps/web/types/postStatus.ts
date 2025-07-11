import { Platform } from './socialAccount';

export type PostStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'FAILED'
  | 'CANCELLED';

export interface Post {
  id: string;
  content: string;
  media: string[];
  scheduledFor: Date;
  publishedAt?: Date | null;
  status: PostStatus;
  platform: Platform;
  platformPostId?: string | null;
  errorMessage?: string | null;
  userId: string;
  socialAccountId: string;
}
