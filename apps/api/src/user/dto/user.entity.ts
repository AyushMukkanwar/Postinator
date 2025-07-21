import { ApiProperty } from '@nestjs/swagger';
import { SocialAccountEntity } from 'src/social-account/entities/social-account.entity';

export class PostEntity {
  @ApiProperty({ description: 'Post ID', example: 'clp123456789abcdef' })
  id: string;

  @ApiProperty({ description: 'Post content', example: 'Hello world!' })
  content: string;

  @ApiProperty({
    description: 'Array of media URLs (images and videos)',
    type: [String],
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/video1.mp4',
    ],
  })
  media: string[];

  @ApiProperty({
    description: 'Scheduled publication time',
    example: '2024-01-01T12:00:00.000Z',
  })
  scheduledFor: Date;

  @ApiProperty({
    description: 'Actual publication time',
    required: false,
    example: '2024-01-01T12:01:00.000Z',
  })
  publishedAt?: Date | null;

  @ApiProperty({
    description: 'Post status',
    enum: [
      'DRAFT',
      'SCHEDULED',
      'PUBLISHING',
      'PUBLISHED',
      'FAILED',
      'CANCELLED',
    ],
    example: 'SCHEDULED',
  })
  status: string;

  @ApiProperty({
    description: 'Target platform',
    enum: ['LINKEDIN', 'TWITTER'],
    example: 'LINKEDIN',
  })
  platform: string;

  @ApiProperty({
    description: 'Platform post ID after publishing',
    required: false,
    example: 'platform123',
  })
  platformPostId?: string | null;

  @ApiProperty({ description: 'Error message if failed', required: false })
  errorMessage?: string | null;

  @ApiProperty({
    description: 'Post creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Post last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'User ID who created the post',
    example: 'clp123456789abcdef',
  })
  userId: string;

  @ApiProperty({
    description: 'Social account ID used for posting',
    example: 'clp123456789abcdef',
  })
  socialAccountId: string;
}

export class UserEntity {
  @ApiProperty({ description: 'User ID', example: 'clp123456789abcdef' })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User full name',
    required: false,
    example: 'John Doe',
  })
  name?: string | null;

  @ApiProperty({
    description: 'User avatar URL',
    required: false,
    example: 'https://example.com/avatar.jpg',
  })
  avatar?: string | null;

  @ApiProperty({
    description: 'User timezone (IANA timezone identifier)',
    example: 'America/New_York',
    default: 'UTC',
  })
  timezone: string;

  @ApiProperty({
    description: 'User creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'User last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'User social accounts',
    type: [SocialAccountEntity],
    required: false,
  })
  socialAccounts?: SocialAccountEntity[];

  @ApiProperty({
    description: 'User posts',
    type: [PostEntity],
    required: false,
  })
  posts?: PostEntity[];
}
