import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PosterProcessor } from './poster.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EncryptionModule } from '../encryption/encryption.module';
import { TwitterService } from './twitter.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'post',
    }),
    PrismaModule,
    ConfigModule,
    EncryptionModule,
  ],
  providers: [PosterProcessor, TwitterService, ConfigService],
})
export class PosterModule {}
