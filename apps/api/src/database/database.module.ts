// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRepository } from './repositories/user.repository';
import { SocialAccountRepository } from './repositories/social-account.repository';
import { PostRepository } from './repositories/post.repository';

@Module({
  providers: [
    PrismaService,
    UserRepository,
    SocialAccountRepository,
    PostRepository,
  ],
  exports: [
    PrismaService,
    UserRepository,
    SocialAccountRepository,
    PostRepository,
  ],
})
export class DatabaseModule {}
