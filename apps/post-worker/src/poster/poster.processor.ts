import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { Logger, OnModuleDestroy } from '@nestjs/common';
import { TwitterService } from './twitter.service';
import { EncryptionService } from '../encryption/encryption.service';

@Processor('post')
export class PosterProcessor extends WorkerHost implements OnModuleDestroy {
  private readonly logger = new Logger(PosterProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly twitterService: TwitterService,
    private readonly encryptionService: EncryptionService,
  ) {
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
      let platformPostId: string;

      if (post.socialAccount.platform === 'TWITTER') {
        const { accessToken, refreshToken, expiresAt } = post.socialAccount;

        if (!accessToken) {
          throw new Error('Twitter access token is missing.');
        }

        const decryptedAccessToken =
          this.encryptionService.decrypt(accessToken);

        const decryptedRefreshToken = refreshToken
          ? this.encryptionService.decrypt(refreshToken)
          : undefined;

        const { tweetId } = await this.twitterService.postTweet(
          decryptedAccessToken,
          decryptedRefreshToken,
          expiresAt,
          post.content,
          async (newAccessToken, newRefreshToken, newExpiresAt) => {
            const encryptedAccessToken =
              this.encryptionService.encrypt(newAccessToken);
            const encryptedRefreshToken =
              this.encryptionService.encrypt(newRefreshToken);

            await this.prisma.socialAccount.update({
              where: { id: post.socialAccountId },
              data: {
                accessToken: encryptedAccessToken,
                refreshToken: encryptedRefreshToken,
                expiresAt: newExpiresAt,
              },
            });
          },
        );
        platformPostId = tweetId;
      } else {
        // Simulate posting to other social media platforms
        this.logger.log(
          `Posting to ${post.socialAccount.platform} for user ${post.userId}: "${post.content}"`,
        );

        if (post.content === 'FAIL') {
          throw new Error('Simulated post failure');
        }
        platformPostId = `fake-post-id-${Date.now()}`;
      }

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
