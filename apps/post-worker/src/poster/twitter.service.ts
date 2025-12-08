import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TwitterApi } from 'twitter-api-v2';

@Injectable()
export class TwitterService {
  private readonly logger = new Logger(TwitterService.name);

  constructor(private readonly configService: ConfigService) {}

  async postTweet(
    accessToken: string,
    refreshToken: string | null | undefined,
    expiresAt: Date | null | undefined,
    text: string,
    updateTokens: (
      newAccessToken: string,
      newRefreshToken: string,
      newExpiresAt: Date,
    ) => Promise<void>,
  ): Promise<{
    tweetId: string;
  }> {
    const clientId = this.configService.get<string>('TWITTER_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'TWITTER_CLIENT_SECRET',
    );

    if (!clientId || !clientSecret) {
      const errorMessage = 'Twitter client ID or secret is not configured.';
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const isExpired =
      expiresAt && new Date(expiresAt.getTime() - 5 * 60 * 1000) < new Date();

    let currentAccessToken = accessToken;

    if (isExpired && refreshToken) {
      this.logger.log('Token expired, refreshing...');
      try {
        const client = new TwitterApi({
          clientId,
          clientSecret,
        });

        const {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn,
        } = await client.refreshOAuth2Token(refreshToken);

        const newExpiresAt = new Date(Date.now() + expiresIn * 1000);

        await updateTokens(
          newAccessToken,
          newRefreshToken || refreshToken,
          newExpiresAt,
        );
        currentAccessToken = newAccessToken;
        this.logger.log('Token refreshed successfully.');
      } catch (error) {
        this.logger.error('Failed to refresh token:', error);
        throw error;
      }
    }

    const client = new TwitterApi(currentAccessToken);

    try {
      const { data: tweetData, errors } = await client.v2.tweet(text);

      if (errors) {
        const errorMessage = `Failed to post tweet: ${JSON.stringify(errors)}`;
        this.logger.error(errorMessage);
        throw new Error(errorMessage);
      }

      return { tweetId: tweetData.id };
    } catch (error) {
      // If 401 Unauthorized, try to refresh token and retry once
      if (
        refreshToken &&
        (error as any).code === 401 &&
        !isExpired // Avoid double refresh if we already tried
      ) {
        this.logger.warn('Received 401, trying to refresh token and retry...');
        try {
          const client = new TwitterApi({
            clientId,
            clientSecret,
          });

          const {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn,
          } = await client.refreshOAuth2Token(refreshToken);

          const newExpiresAt = new Date(Date.now() + expiresIn * 1000);

          await updateTokens(
            newAccessToken,
            newRefreshToken || refreshToken,
            newExpiresAt,
          );

          const retryClient = new TwitterApi(newAccessToken);
          const { data: tweetData, errors } = await retryClient.v2.tweet(text);

          if (errors) {
            const errorMessage = `Failed to post tweet after retry: ${JSON.stringify(
              errors,
            )}`;
            this.logger.error(errorMessage);
            throw new Error(errorMessage);
          }

          return { tweetId: tweetData.id };
        } catch (retryError) {
          this.logger.error(
            'Failed to refresh token or retry post:',
            retryError,
          );
          throw retryError;
        }
      }

      if (error instanceof Error) {
        this.logger.error(
          `An unexpected error occurred while posting tweet: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(
          'An unexpected error occurred while posting tweet',
          error,
        );
      }
      throw error;
    }
  }
}
