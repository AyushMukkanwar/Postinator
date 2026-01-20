import { ApiProperty } from '@nestjs/swagger';
import { PostEntity } from 'src/post/entities/post.entity';
import { SocialAccountEntity } from 'src/social-account/entities/social-account.entity';

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
