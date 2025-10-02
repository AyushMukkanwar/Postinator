export type Post = {
  id: string;
  content: string;
  media: string[];
  scheduledFor: string;
  publishedAt: string | null;
  status: string;
  platform: string;
  platformPostId: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  socialAccountId: string;
};
