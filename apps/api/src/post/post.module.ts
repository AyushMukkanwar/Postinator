import { Module, forwardRef } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { BullModule } from '@nestjs/bull';
import { DatabaseModule } from '../database/database.module';
import { PostQueueModule } from '../queue/post-queue.module';
import { AppCacheModule } from 'src/cache/cache.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'post',
    }),
    DatabaseModule,
    forwardRef(() => PostQueueModule),
    AppCacheModule,
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
