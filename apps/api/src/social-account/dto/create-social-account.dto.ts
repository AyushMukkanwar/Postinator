import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Platform } from 'generated/prisma';

export class CreateSocialAccountDto {
  @ApiProperty({
    description: 'Social media platform',
    enum: Platform,
    example: Platform.LINKEDIN,
  })
  @IsEnum(Platform)
  platform: Platform;

  @ApiProperty({ description: 'Platform user ID', example: '12345678' })
  @IsString()
  platformId: string;

  @ApiProperty({ description: 'Platform username', example: 'johndoe' })
  @IsString()
  username: string;

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
    description: 'Access token for platform API',
    example: 'access_token_123',
  })
  @IsString()
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token for platform API',
    required: false,
    example: 'refresh_token_456',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiProperty({
    description: 'Token expiration in seconds',
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

  // Remove userId - it will come from JWT token
}
