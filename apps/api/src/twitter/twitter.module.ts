// apps/api/src/twitter/twitter.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TwitterService } from './twitter.service';

@Module({
  imports: [ConfigModule], // Import ConfigModule if not global
  providers: [TwitterService],
  exports: [TwitterService], // Make sure to export it!
})
export class TwitterModule {}
