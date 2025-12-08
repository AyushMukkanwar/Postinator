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
      clientId: apiKey,
      clientSecret: apiSecret,
    });
  }

  getAuthorizationUrl(): {
    url: string;
    codeVerifier: string;
    state: string;
  } {
    const callbackUrl = this.configService.get<string>('TWITTER_REDIRECT_URI');
    if (!callbackUrl) {
      console.error('TwitterService: TWITTER_REDIRECT_URI is missing');
      throw new InternalServerErrorException(
        'Twitter callback URL not configured'
      );
    }

    const { url, codeVerifier, state } = this.client.generateOAuth2AuthLink(
      callbackUrl,
      {
        scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      }
    );

    return { url, codeVerifier, state };
  }

  async login(
    code: string,
    codeVerifier: string,
    redirectUri: string
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
    userId: string;
    username: string;
    name?: string;
    profileImageUrl?: string;
  }> {
    try {
      const {
        client: loggedClient,
        accessToken,
        refreshToken,
        expiresIn,
      } = await this.client.loginWithOAuth2({
        code,
        codeVerifier,
        redirectUri,
      });

      const {
        data: { id, username, name, profile_image_url },
      } = await loggedClient.v2.me({ 'user.fields': ['profile_image_url'] });

      return {
        accessToken,
        refreshToken,
        expiresIn,
        userId: id,
        username,
        name,
        profileImageUrl: profile_image_url,
      };
    } catch (error) {
      console.error('TwitterService: Failed to login with OAuth 2.0:', error);
      throw error;
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  }> {
    try {
      const {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn,
      } = await this.client.refreshOAuth2Token(refreshToken);

      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn,
      };
    } catch (error) {
      console.error('TwitterService: Failed to refresh token:', error);
      throw error;
    }
  }
}
