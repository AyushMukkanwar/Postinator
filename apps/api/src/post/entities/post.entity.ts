import { ApiProperty } from '@nestjs/swagger';
import { Platform, PostStatus } from '@repo/database';

export class PostEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  media: string[];

  @ApiProperty()
  scheduledFor: Date;

  @ApiProperty({ enum: PostStatus })
  status: PostStatus;

  @ApiProperty({ enum: Platform })
  platform: Platform;

  @ApiProperty()
  socialAccountId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false, nullable: true })
  postedAt?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  failedReason?: string | null;
}
