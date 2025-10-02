import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  Get,
  Query,
  UseGuards,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  Inject,
  OnModuleDestroy,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService, EnhancedTokenResponse } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { SocialAccountService } from '../social-account/social-account.service';
import { JwtAuthGuard } from './guards/jwt.auth.guard';
import { User } from './decorators/user.decorator';
import {
  User as UserEntity,
  Platform,
  TokenType,
} from '../../generated/prisma';
import { TwitterService } from '../twitter/twitter.service';
import { createClient, RedisClientType } from 'redis';

// DTOs for request validation
export class ExchangeTokenDto {
  @IsString()
  @IsNotEmpty()
  supabaseToken: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

// Response interfaces
export interface AuthResponse {
  user: {
    id: string;
    email: string;
  };
  token: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController implements OnModuleDestroy {
  private redisClient: RedisClientType;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly socialAccountService: SocialAccountService,
    private readonly twitterService: TwitterService
  ) {
    // Initialize Redis client directly
    this.redisClient = createClient({
      socket: {
        host: this.configService.get('REDIS_HOST'),
        port: this.configService.get('REDIS_PORT'),
      },
    });
    this.redisClient.connect().catch((err) => {
      console.error('Failed to connect to Redis:', err);
    });
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  private setCookieOptions(request: Request) {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const cookieDomain = this.configService.get<string>('COOKIE_DOMAIN');

    // In development/Docker, set domain to localhost to allow cross-container communication
    const domain = isProduction ? cookieDomain : 'localhost';

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
      domain,
      maxAge: 60 * 60 * 1000, // 1 hour in milliseconds
    };
  }

  @Post('exchange-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange Supabase token for enhanced JWT' })
  @ApiResponse({
    status: 200,
    description: 'Token exchanged successfully',
  })
  @ApiResponse({ status: 401, description: 'Invalid Supabase token' })
  async exchangeToken(
    @Body() exchangeTokenDto: ExchangeTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthResponse> {
    const { token, user }: EnhancedTokenResponse =
      await this.authService.exchangeSupabaseToken(
        exchangeTokenDto.supabaseToken
      );

    const cookieOptions = this.setCookieOptions(request);

    response.cookie('access_token', token, cookieOptions);

    return { user, token };
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh expired JWT using Supabase refresh token' })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthResponse> {
    const { token, user }: EnhancedTokenResponse =
      await this.authService.refreshToken(refreshTokenDto.refreshToken);

    const cookieOptions = this.setCookieOptions(request);
    response.cookie('access_token', token, cookieOptions);

    return { user, token };
  }

  @Get('twitter')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Initiate Twitter OAuth 1.0a flow' })
  async getTwitterAuthUrl(@User() user: UserEntity, @Res() response: Response) {
    try {
      const { oauth_token, oauth_token_secret, oauth_callback_confirmed } =
        await this.twitterService.getRequestToken();

      if (
        !oauth_token ||
        !oauth_token_secret ||
        oauth_callback_confirmed !== 'true'
      ) {
        throw new InternalServerErrorException(
          'Failed to get valid request token from Twitter'
        );
      }

      // Store the temporary request token secret and user ID in Redis
      const cacheValue = JSON.stringify({
        secret: oauth_token_secret,
        userId: user.id,
      });
      await this.redisClient.set(oauth_token, cacheValue, { EX: 600 }); // 10 minute expiry

      const authUrl = this.twitterService.getAuthorizeUrl(oauth_token);
      response.redirect(authUrl);
    } catch (error) {
      console.error('Error initiating Twitter auth:', error);
      const message =
        error instanceof Error ? error.message : 'Unknown Twitter API error';
      throw new InternalServerErrorException(
        `Failed to initiate Twitter auth: ${message}`
      );
    }
  }

  @Get('twitter/callback')
  @ApiOperation({ summary: 'Handle Twitter OAuth 1.0a callback' })
  async twitterAuthCallback(
    @Query('oauth_token') oauthToken: string,
    @Query('oauth_verifier') oauthVerifier: string,
    @Res() response: Response
  ) {
    if (!oauthToken || !oauthVerifier) {
      throw new UnauthorizedException('OAuth token or verifier missing');
    }

    try {
      // Retrieve the temporary request token secret and user ID from Redis
      const cachedValueString = await this.redisClient.get(oauthToken);

      if (!cachedValueString) {
        throw new NotFoundException(
          'OAuth token secret not found in cache or has expired.'
        );
      }

      const cachedValue = JSON.parse(cachedValueString) as {
        secret: string;
        userId: string;
      };

      const { secret: oauthTokenSecret, userId: cachedUserId } = cachedValue;

      // We have what we need, so we can delete the temporary token from the cache
      await this.redisClient.del(oauthToken);

      const {
        accessToken,
        accessTokenSecret,
        userId,
        username,
        name,
        profileImageUrl,
      } = await this.twitterService.getAccessToken(
        oauthToken,
        oauthVerifier,
        oauthTokenSecret
      );

      if (!accessToken || !accessTokenSecret || !userId || !username) {
        throw new InternalServerErrorException(
          'Failed to get valid access token from Twitter'
        );
      }

      // Now that we have the permanent access token, we can upsert the social account
      await this.socialAccountService.upsert(
        {
          platform: Platform.TWITTER,
          tokenType: TokenType.OAUTH1,
          platformId: userId,
          username,
          displayName: name ?? undefined,
          avatar: profileImageUrl ?? undefined,
          accessToken,
          accessSecret: accessTokenSecret,
        },
        cachedUserId
      );

      response.redirect(
        `${this.configService.get('WEB_URL')}/dashboard?new-account=true`
      );
    } catch (error) {
      console.error('Error in Twitter auth callback:', error);
      response.redirect(
        `${this.configService.get(
          'WEB_URL'
        )}/dashboard?error=twitter-auth-failed`
      );
    }
  }
}
