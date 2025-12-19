import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class LinkedinService {
  private readonly logger = new Logger(LinkedinService.name);
  private readonly baseUrl = 'https://api.linkedin.com';

  constructor(private readonly configService: ConfigService) {}

  getAuthorizationUrl(): { url: string; state: string } {
    const clientId = this.configService.get<string>('LINKEDIN_CLIENT_ID');
    const redirectUri = 'http://localhost:3000/linkedin/callback'; // Frontend Route
    const scope = encodeURIComponent('openid profile w_member_social email');
    const state = crypto.randomBytes(16).toString('hex');

    const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;

    return { url, state };
  }

  async login(code: string, redirectUri: string) {
    const clientId = this.configService.get<string>('LINKEDIN_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'LINKEDIN_CLIENT_SECRET'
    );

    if (!clientId || !clientSecret) {
      throw new Error('LinkedIn client ID or secret is not configured.');
    }

    // 1. Exchange Code for Token
    this.logger.log(`Exchanging code for token... Code length: ${code.length}`);
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const tokenResponse = await fetch(
      'https://www.linkedin.com/oauth/v2/accessToken',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      this.logger.error(`LinkedIn Token Exchange Failed: ${errorText}`);
      throw new Error(`LinkedIn Token Exchange Failed: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    this.logger.log('Token exchange successful');
    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in;

    // 2. Get User Profile (For the URN!)
    this.logger.log('Fetching user profile...');
    const profileResponse = await fetch(
      'https://api.linkedin.com/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      this.logger.error(`LinkedIn Profile Fetch Failed: ${errorText}`);
      throw new Error(`LinkedIn Profile Fetch Failed: ${errorText}`);
    }

    const profile = await profileResponse.json();
    this.logger.log(`Profile fetched: ${JSON.stringify(profile)}`);
    // profile.sub IS the URN (e.g. urn:li:person:123)

    return {
      accessToken,
      expiresIn,
      platformId: profile.sub,
      name: profile.name,
      email: profile.email,
      picture: profile.picture,
    };
  }
}
