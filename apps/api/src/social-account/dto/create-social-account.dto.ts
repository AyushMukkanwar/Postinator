import { ApiProperty } from '@nestjs/swagger';
import { Platform, TokenType } from '@repo/database';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSocialAccountDto {
  @ApiProperty({
    description: 'Social media platform',
    enum: Platform,
    example: 'LINKEDIN',
  })
  platform: Platform;

  @ApiProperty({
    description: 'Platform user ID',
    example: '12345678',
    required: false,
  })
  @IsOptional()
  @IsString()
  platformId?: string;

  @ApiProperty({
    description: 'Platform username',
    example: 'johndoe',
    required: false,
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({
    description: 'Display name on platform',
    required: false,
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({
    description: 'Avatar URL from platform',
    required: false,
    example: 'https://platform.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({
    description: 'Authentication protocol used',
    enum: TokenType,
    example: 'OAUTH2',
  })
  tokenType: TokenType;

  @ApiProperty({
    description: 'Access token for the platform API (OAuth1 or OAuth2)',
    example: 'access_token_123',
  })
  @IsString()
  accessToken: string;

  @ApiProperty({
    description: 'Access token secret (for OAuth1)',
    required: false,
    example: 'access_secret_789',
  })
  @IsOptional()
  @IsString()
  accessSecret?: string;

  @ApiProperty({
    description: 'Refresh token for the platform API (for OAuth2)',
    required: false,
    example: 'refresh_token_456',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiProperty({
    description: 'Token expiration date (for OAuth2)',
    required: false,
    example: '2024-06-01T00:00:00.000Z',
  })
  @IsOptional()
  expiresAt?: Date;

  @ApiProperty({
    description: 'Refresh token expiration date (for OAuth2)',
    required: false,
    example: '2024-08-01T00:00:00.000Z',
  })
  @IsOptional()
  refreshTokenExpiresAt?: Date;

  @ApiProperty({
    description: 'Token expiration in seconds from now (for OAuth2)',
    required: false,
    example: 3600,
  })
  @IsOptional()
  @IsNumber()
  expiresIn?: number;

  @ApiProperty({ description: 'Whether account is active', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
