import { ApiProperty } from '@nestjs/swagger';

export class SocialAccountEntity {
  @ApiProperty({ description: 'Social account ID', example: 'clp123456789abcdef' })
  id: string;

  @ApiProperty({ description: 'Social media platform', enum: ['LINKEDIN', 'TWITTER'], example: 'LINKEDIN' })
  platform: string;

  @ApiProperty({ description: 'Platform user ID', example: '12345678' })
  platformId: string;

  @ApiProperty({ description: 'Platform username', example: 'johndoe' })
  username: string;

  @ApiProperty({ description: 'Display name on platform', required: false, example: 'John Doe' })
  displayName?: string | null;

  @ApiProperty({ description: 'Avatar URL from platform', required: false, example: 'https://platform.com/avatar.jpg' })
  avatar?: string | null;

  @ApiProperty({ description: 'Whether account is active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Account creation date', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'User ID this account belongs to', example: 'clp123456789abcdef' })
  userId: string;
}

export class PostEntity {
  @ApiProperty({ description: 'Post ID', example: 'clp123456789abcdef' })
  id: string;

  @ApiProperty({ description: 'Post content', example: 'Hello world!' })
  content: string;

  @ApiProperty({ description: 'Scheduled publication time', example: '2024-01-01T12:00:00.000Z' })
  scheduledFor: Date;

  @ApiProperty({ description: 'Actual publication time', required: false, example: '2024-01-01T12:01:00.000Z' })
  publishedAt?: Date | null;

  @ApiProperty({ description: 'Post status', enum: ['SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'CANCELLED'], example: 'SCHEDULED' })
  status: string;

  @ApiProperty({ description: 'Target platform', enum: ['LINKEDIN', 'TWITTER'], example: 'LINKEDIN' })
  platform: string;

  @ApiProperty({ description: 'Platform post ID after publishing', required: false, example: 'platform123' })
  platformPostId?: string | null;

  @ApiProperty({ description: 'Error message if failed', required: false })
  errorMessage?: string | null;

  @ApiProperty({ description: 'Post creation date', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Post last update date', example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ description: 'User ID who created the post', example: 'clp123456789abcdef' })
  userId: string;

  @ApiProperty({ description: 'Social account ID used for posting', example: 'clp123456789abcdef' })
  socialAccountId: string;
}

export class UserEntity {
  @ApiProperty({ description: 'User ID', example: 'clp123456789abcdef' })
  id: string;

  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'User full name', required: false, example: 'John Doe' })
  name?: string | null;

  @ApiProperty({ description: 'User avatar URL', required: false, example: 'https://example.com/avatar.jpg' })
  avatar?: string | null;

  @ApiProperty({ description: 'User creation date', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'User last update date', example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ description: 'User social accounts', type: [SocialAccountEntity], required: false })
  socialAccounts?: SocialAccountEntity[];

  @ApiProperty({ description: 'User posts', type: [PostEntity], required: false })
  posts?: PostEntity[];
}
