import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Req,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService, EnhancedTokenResponse } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ConfigService } from '@nestjs/config';

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
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  private setCookieOptions(request: Request) {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const cookieDomain = this.configService.get<string>('COOKIE_DOMAIN');

    // In development/Docker, don't set domain to allow cross-container communication
    const domain = isProduction ? cookieDomain : undefined;

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
    console.log('🔄 Processing token exchange request');

    const { token, user }: EnhancedTokenResponse =
      await this.authService.exchangeSupabaseToken(
        exchangeTokenDto.supabaseToken
      );

    const cookieOptions = this.setCookieOptions(request);

    console.log('🍪 Setting cookie with options:', {
      ...cookieOptions,
      domain: cookieOptions.domain || 'none (cross-container)',
    });

    response.cookie('access_token', token, cookieOptions);

    console.log('✅ Token exchange successful for user:', user.email);
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
    console.log('🔄 Processing token refresh request');

    const { token, user }: EnhancedTokenResponse =
      await this.authService.refreshToken(refreshTokenDto.refreshToken);

    const cookieOptions = this.setCookieOptions(request);
    response.cookie('access_token', token, cookieOptions);

    console.log('✅ Token refresh successful for user:', user.email);
    return { user, token };
  }
}
