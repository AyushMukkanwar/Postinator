import { Module, forwardRef } from '@nestjs/common';
import { PostQueueService } from './post-queue.service';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PostModule } from '../post/post.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'post',
    }),
    forwardRef(() => PostModule),
  ],
  providers: [PostQueueService],
  exports: [PostQueueService], // Export the service so it can be used by other modules
})
export class PostQueueModule {}
