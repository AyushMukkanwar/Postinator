import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { SocialAccountModule } from './social-account/social-account.module';
import { EncryptionModule } from './encryption/encryption.module';
import { BullModule } from '@nestjs/bullmq';
import { AppCacheModule } from './cache/cache.module';
import { HealthModule } from './health/health.module';
import { PostQueueModule } from './queue/post-queue.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute per IP
      },
      {
        name: 'strict',
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute per IP
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    AuthModule,
    UserModule,
    SocialAccountModule,
    EncryptionModule,
    PostQueueModule,
    AppCacheModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
