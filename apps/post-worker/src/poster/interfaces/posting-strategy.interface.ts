import { SocialAccount } from '@repo/database';

export interface IPostingStrategy {
  post(
    account: SocialAccount,
    content: string,
    mediaUrls: string[],
    updateTokensCallback: (
      accessToken: string,
      refreshToken: string,
      expiresAt: Date,
    ) => Promise<void>,
  ): Promise<{ postId: string }>;
}
