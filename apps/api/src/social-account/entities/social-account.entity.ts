import { ApiProperty } from '@nestjs/swagger';
import { Platform, TokenType } from '@repo/db';

export class SocialAccountEntity {
  @ApiProperty({
    description: 'Social account ID',
    example: 'clp123456789abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Social media platform',
    enum: Platform,
    example: 'LINKEDIN',
  })
  platform: Platform;

  @ApiProperty({ description: 'Platform user ID', example: '12345678' })
  platformId: string;

  @ApiProperty({ description: 'Platform username', example: 'johndoe' })
  username: string;

  @ApiProperty({
    description: 'Display name on platform',
    required: false,
    example: 'John Doe',
  })
  displayName?: string | null;

  @ApiProperty({
    description: 'Avatar URL from platform',
    required: false,
    example: 'https://platform.com/avatar.jpg',
  })
  avatar?: string | null;

  @ApiProperty({
    description: 'Authentication protocol used',
    enum: TokenType,
    example: 'OAUTH2',
  })
  tokenType: TokenType;

  @ApiProperty({
    description: 'Access token for the platform API',
    example: 'access_token_123',
  })
  accessToken: string;

  // accessSecret is intentionally omitted for security

  @ApiProperty({
    description: 'Refresh token for the platform API (for OAuth2)',
    required: false,
    example: 'refresh_token_456',
  })
  refreshToken?: string | null;

  @ApiProperty({
    description: 'Token expiration date (for OAuth2)',
    required: false,
    example: '2024-06-01T00:00:00.000Z',
  })
  expiresAt?: Date | null;

  @ApiProperty({ description: 'Whether account is active', example: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Account creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'User ID this account belongs to',
    example: 'clp123456789abcdef',
  })
  userId: string;
}
