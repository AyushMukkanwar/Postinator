import { Module, forwardRef } from '@nestjs/common';
import { PostQueueService } from './post-queue.service';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PostModule } from '../post/post.module';
import { PostProcessor } from './post.processor';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (redisUrl) {
          return {
            redis: redisUrl as any,
          };
        }
        return {
          redis: {
            host: configService.get<string>('REDIS_HOST') || 'localhost',
            port: configService.get<number>('REDIS_PORT') || 6379,
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'post',
    }),
    forwardRef(() => PostModule), // Import PostModule to make PostService available for injection in processor
  ],
  providers: [PostQueueService, PostProcessor],
  exports: [PostQueueService], // Export the service so it can be used by other modules
})
export class PostQueueModule {}
