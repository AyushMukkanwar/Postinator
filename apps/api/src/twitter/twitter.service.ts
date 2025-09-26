// apps/api/src/twitter/twitter.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TwitterService {
  constructor(private configService: ConfigService) {
    // Ensure the required config values are available
    const apiKey = this.configService.get<string>('TWITTER_API_KEY');
    const apiSecret = this.configService.get<string>('TWITTER_API_SECRET');

    if (!apiKey || !apiSecret) {
      throw new Error(
        'Twitter API credentials are missing from environment variables'
      );
    }
  }

  // Your Twitter service methods here
}
