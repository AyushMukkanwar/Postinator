import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { Logger, OnModuleDestroy } from '@nestjs/common';

@Processor('post')
export class PosterProcessor extends WorkerHost implements OnModuleDestroy {
  private readonly logger = new Logger(PosterProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async onModuleDestroy() {
    await this.worker.close();
  }

  async process(job: Job<{ postId: string }>): Promise<void> {
    const { postId } = job.data;
    this.logger.log(`Processing post with ID: ${postId}`);

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { socialAccount: true },
    });

    if (!post) {
      this.logger.error(`Post with ID ${postId} not found.`);
      return;
    }

    if (post.status !== 'SCHEDULED') {
      this.logger.warn(
        `Post ${postId} is no longer in a scheduled state (current state: ${post.status}). Skipping.`,
      );
      return;
    }

    try {
      // Simulate posting to the social media platform
      this.logger.log(
        `Posting to ${post.socialAccount.platform} for user ${post.userId}: "${post.content}"`,
      );

      if (post.content === 'FAIL') {
        throw new Error('Simulated post failure');
      }

      // Simulate a successful post with a fake platform ID
      const platformPostId = `fake-post-id-${Date.now()}`;

      await this.prisma.post.update({
        where: { id: postId },
        data: { status: 'PUBLISHED', platformPostId },
      });

      this.logger.log(`Successfully posted post with ID: ${postId}`);
    } catch (error) {
      this.logger.error(`Failed to post post with ID: ${postId}`, error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unknown error has occurred';

      await this.prisma.post.update({
        where: { id: postId },
        data: {
          status: 'FAILED',
          errorMessage,
        },
      });
    }
  }
}
