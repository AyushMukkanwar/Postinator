import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PostService } from '../post/post.service';

@Processor('post')
export class PostProcessor {
  private readonly logger = new Logger(PostProcessor.name);

  constructor(private readonly postService: PostService) {}

  @Process('schedulePost')
  async handleSchedulePost(job: Job<{ postId: string; scheduledFor: Date }>) {
    this.logger.log(`Processing job ${job.id} for post ${job.data.postId}`);
    // In a real application, this is where you'd trigger the actual publishing
    // logic, e.g., calling a third-party API to publish to social media.
    // For now, we'll just log and mark as published in our DB.
    try {
      // Simulate publishing delay
      await new Promise((resolve) => setTimeout(resolve, 5000));

      await this.postService.markPostAsPublished(
        job.data.postId,
        'mockPlatformPostId'
      );
      this.logger.log(`Post ${job.data.postId} successfully published.`);
    } catch (error) {
      this.logger.error(
        `Failed to publish post ${job.data.postId}: ${error.message}`
      );
      await this.postService.markPostAsFailed(job.data.postId, error.message);
      throw error; // Re-throw to mark job as failed in BullMQ
    }
  }
}
