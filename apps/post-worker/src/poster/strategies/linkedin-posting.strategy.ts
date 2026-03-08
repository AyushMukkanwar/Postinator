import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialAccount } from '@repo/database';
import { IPostingStrategy } from '../interfaces/posting-strategy.interface';

export class LinkedInPostingStrategy implements IPostingStrategy {
  private readonly logger = new Logger(LinkedInPostingStrategy.name);

  constructor(private readonly configService: ConfigService) {}

  async post(
    account: SocialAccount,
    content: string,
    mediaUrls: string[],
    updateTokensCallback: (
      accessToken: string,
      refreshToken: string,
      expiresAt: Date,
    ) => Promise<void>,
  ): Promise<{ postId: string }> {
    let currentAccessToken = account.accessToken;
    const isExpired =
      account.expiresAt &&
      new Date(account.expiresAt.getTime() - 5 * 60 * 1000) < new Date();

    if (isExpired && account.refreshToken) {
      this.logger.log('LinkedIn token expired, refreshing...');
      try {
        const clientId = this.configService.get<string>('LINKEDIN_CLIENT_ID');
        const clientSecret = this.configService.get<string>(
          'LINKEDIN_CLIENT_SECRET',
        );

        if (!clientId || !clientSecret) {
          throw new Error('Missing LinkedIn Client ID or Secret for refresh');
        }

        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', account.refreshToken);
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);

        const refreshResponse = await fetch(
          'https://www.linkedin.com/oauth/v2/accessToken',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          },
        );

        if (!refreshResponse.ok) {
          throw new Error(
            `Failed to refresh token: ${await refreshResponse.text()}`,
          );
        }

        const data = await refreshResponse.json();
        currentAccessToken = data.access_token;
        const newExpiresIn = data.expires_in;
        const newRefreshToken = data.refresh_token || account.refreshToken;
        const newExpiresAt = new Date(Date.now() + newExpiresIn * 1000);

        await updateTokensCallback(
          currentAccessToken,
          newRefreshToken,
          newExpiresAt,
        );
        this.logger.log('LinkedIn token refreshed successfully.');
      } catch (error) {
        this.logger.error('Failed to refresh LinkedIn token', error);
        throw error;
      }
    }

    const { platformId } = account;

    if (!platformId) throw new Error('Missing Platform ID (URN)');

    // Ensure platformId is a URN. OpenID 'sub' is usually just the ID.
    const authorUrn = platformId.startsWith('urn:')
      ? platformId
      : `urn:li:person:${platformId}`;

    // Prepare Media
    let assetUrn: string | undefined;

    if (mediaUrls && mediaUrls.length > 0 && mediaUrls[0]) {
      try {
        // Register
        const { asset, uploadUrl } = await this.registerUpload(
          currentAccessToken,
          authorUrn,
        );

        assetUrn = asset;

        // Upload
        await this.uploadImage(currentAccessToken, uploadUrl, mediaUrls[0]);
      } catch (error) {
        this.logger.error('Media upload failed, posting text only', error);
      }
    }

    // Post
    return this.createPost(currentAccessToken, authorUrn, content, assetUrn);
  }

  private async registerUpload(
    token: string,
    owner: string,
  ): Promise<{ uploadUrl: string; asset: string }> {
    const registerResponse = await fetch(
      'https://api.linkedin.com/v2/assets?action=registerUpload',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'LinkedIn-Version': '2024-01',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner,
            serviceRelationships: [
              {
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent',
              },
            ],
          },
        }),
      },
    );

    if (!registerResponse.ok) {
      const errorText = await registerResponse.text();
      throw new Error(`LinkedIn Register Upload Failed: ${errorText}`);
    }

    const data = await registerResponse.json();
    const uploadMechanism =
      data.value.uploadMechanism[
        'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
      ];

    return {
      uploadUrl: uploadMechanism.uploadUrl,
      asset: data.value.asset,
    };
  }

  private async uploadImage(
    token: string,
    uploadUrl: string,
    imageUrl: string,
  ): Promise<void> {
    // Download the image
    const sourceResponse = await fetch(imageUrl);

    if (!sourceResponse.ok)
      throw new Error(`Failed to download source image: ${imageUrl}`);

    const arrayBuffer = await sourceResponse.arrayBuffer();

    // Upload raw bytes to LinkedIn
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`, // Sometimes optional, but safest to include
        'Content-Type': 'application/octet-stream',
        'LinkedIn-Version': '2024-01',
      },
      body: Buffer.from(arrayBuffer),
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`LinkedIn Binary Upload Failed: ${errorText}`);
    }
  }

  private async createPost(
    token: string,
    authorUrn: string,
    text: string,
    assetUrn?: string,
  ): Promise<{ postId: string }> {
    const postBody = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: text,
          },
          shareMediaCategory: assetUrn ? 'IMAGE' : 'NONE',
          media: assetUrn
            ? [
                {
                  status: 'READY',
                  description: { text: 'Image' },
                  media: assetUrn,
                  title: { text: 'Image' },
                },
              ]
            : undefined,
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };
    const postResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '2024-01',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postBody),
    });
    if (!postResponse.ok) {
      const errorText = await postResponse.text();
      throw new Error(`LinkedIn Post Failed: ${errorText}`);
    }
    const postData = await postResponse.json();
    return { postId: postData.id };
  }
}
