// apps/api/src/twitter/twitter.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TwitterApi } from 'twitter-api-v2';

@Injectable()
export class TwitterService {
  private client: TwitterApi;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('TWITTER_CLIENT_ID');
    const apiSecret = this.configService.get<string>('TWITTER_CLIENT_SECRET');
    const callbackUrl = this.configService.get<string>('TWITTER_REDIRECT_URI');

    if (!apiKey || !apiSecret || !callbackUrl) {
      throw new Error(
        'Twitter API credentials or callback URL are missing from environment variables'
      );
    }

    this.client = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
    });
  }

  async getRequestToken(): Promise<{
    oauth_token: string;
    oauth_token_secret: string;
    oauth_callback_confirmed: string;
  }> {
    const callbackUrl = this.configService.get<string>('TWITTER_REDIRECT_URI');
    if (!callbackUrl) {
      console.error('TwitterService: TWITTER_REDIRECT_URI is missing');
      throw new InternalServerErrorException(
        'Twitter callback URL not configured'
      );
    }
    try {
      return await this.client.generateAuthLink(callbackUrl);
    } catch (error) {
      console.error('TwitterService: Failed to generate auth link:', error);
      throw error;
    }
  }

  getAuthorizeUrl(oauth_token: string): string {
    return `https://api.twitter.com/oauth/authorize?oauth_token=${oauth_token}`;
  }

  async getAccessToken(
    oauth_token: string,
    oauth_verifier: string,
    oauth_token_secret: string
  ): Promise<{
    accessToken: string;
    accessTokenSecret: string;
    userId: string;
    username: string;
    name?: string;
    profileImageUrl?: string;
  }> {
    console.log('TwitterService.getAccessToken inputs:', {
      oauth_token,
      oauth_verifier,
      oauth_token_secret,
    });

    const client = new TwitterApi({
      appKey: this.configService.get<string>('TWITTER_CLIENT_ID')!,
      appSecret: this.configService.get<string>('TWITTER_CLIENT_SECRET')!,
      accessToken: oauth_token,
      accessSecret: oauth_token_secret,
    });

    try {
      const {
        accessToken,
        accessSecret,
        client: loggedClient,
      } = await client.login(oauth_verifier);

      const {
        data: { id, username, name, profile_image_url },
      } = await loggedClient.v2.me({ 'user.fields': ['profile_image_url'] });

      return {
        accessToken,
        accessTokenSecret: accessSecret,
        userId: id,
        username,
        name,
        profileImageUrl: profile_image_url,
      };
    } catch (error) {
      console.error('TwitterService: Failed to get access token:', error);
      throw error;
    }
  }
}
