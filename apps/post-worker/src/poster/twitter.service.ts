import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TwitterApi } from 'twitter-api-v2';

@Injectable()
export class TwitterService {
  private readonly logger = new Logger(TwitterService.name);

  constructor(private readonly configService: ConfigService) {}

  async postTweet(
    accessToken: string,
    accessSecret: string,
    text: string,
  ): Promise<{
    tweetId: string;
  }> {
    const appKey = this.configService.get<string>('TWITTER_CONSUMER_API_KEY');
    const appSecret = this.configService.get<string>(
      'TWITTER_CONSUMER_API_SECRET',
    );

    if (!appKey || !appSecret) {
      const errorMessage =
        'Twitter consumer API key or secret is not configured.';
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    const client = new TwitterApi({
      appKey,
      appSecret,
      accessToken,
      accessSecret,
    });

    try {
      const { data: tweetData, errors } = await client.v2.tweet(text);

      if (errors) {
        const errorMessage = `Failed to post tweet: ${JSON.stringify(errors)}`;
        this.logger.error(errorMessage);
        throw new Error(errorMessage);
      }

      this.logger.log(`Successfully posted tweet: ${tweetData.id}`);
      return { tweetId: tweetData.id };
    } catch (error) {
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
