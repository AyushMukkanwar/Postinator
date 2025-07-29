import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService, EnhancedTokenResponse } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

// DTOs for request validation
export class ExchangeTokenDto {
  supabaseToken: string;
}

export class RefreshTokenDto {
  refreshToken: string;
}

// Response interfaces
export interface AuthResponse {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('exchange-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange Supabase token for enhanced JWT' })
  @ApiResponse({
    status: 200,
    description: 'Token exchanged successfully',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            email: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid Supabase token' })
  async exchangeToken(
    @Body() exchangeTokenDto: ExchangeTokenDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthResponse> {
    const { token, user }: EnhancedTokenResponse =
      await this.authService.exchangeSupabaseToken(
        exchangeTokenDto.supabaseToken
      );

    response.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      path: '/',
    });

    return { user };
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh expired JWT using Supabase refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            email: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthResponse> {
    const { token, user }: EnhancedTokenResponse =
      await this.authService.refreshToken(refreshTokenDto.refreshToken);

    response.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      path: '/',
    });

    return { user };
  }
}
