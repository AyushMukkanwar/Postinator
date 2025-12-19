import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Platform, SocialAccount } from '@repo/database';
import { Job } from 'bullmq';
import { EncryptionService } from '../encryption/encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import { IPostingStrategy } from './interfaces/posting-strategy.interface';
import { LinkedInPostingStrategy } from './strategies/linkedin-posting.strategy';
import { TwitterPostingStrategy } from './strategies/twitter-posting.strategy';

@Processor('post')
export class PosterProcessor extends WorkerHost implements OnModuleDestroy {
  private readonly logger = new Logger(PosterProcessor.name);

  private readonly strategies: Map<Platform, IPostingStrategy>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
  ) {
    super();

    this.strategies = new Map<Platform, IPostingStrategy>([
      [Platform.TWITTER, new TwitterPostingStrategy(this.configService)],
      [Platform.LINKEDIN, new LinkedInPostingStrategy()],
    ]);
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
      this.logger.warn(`Post ${postId} is not SCHEDULED. Skipping.`);
      return;
    }

    try {
      const account = post.socialAccount;

      const decryptedAccount: SocialAccount = {
        ...account,
        accessToken: this.encryptionService.decrypt(account.accessToken),
        refreshToken: account.refreshToken
          ? this.encryptionService.decrypt(account.refreshToken)
          : null,
      };

      const strategy = this.strategies.get(account.platform);
      if (!strategy) {
        throw new Error(
          `No strategy implemented for platform: ${account.platform}`,
        );
      }

      const { postId: platformPostId } = await strategy.post(
        decryptedAccount,
        post.content,
        post.media,
        // The Callback: If strategy refreshes tokens, we save them here.
        async (newAccess, newRefresh, newExpiry) => {
          await this.prisma.socialAccount.update({
            where: { id: account.id },
            data: {
              accessToken: this.encryptionService.encrypt(newAccess),
              refreshToken: this.encryptionService.encrypt(newRefresh),
              expiresAt: newExpiry,
            },
          });
        },
      );

      await this.prisma.post.update({
        where: { id: postId },
        data: { status: 'PUBLISHED', platformPostId },
      });

      this.logger.log(`Successfully posted ${postId} to ${account.platform}`);
    } catch (error) {
      this.logger.error(`Failed to post ${postId}`, error);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await this.prisma.post.update({
        where: { id: postId },
        data: { status: 'FAILED', errorMessage },
      });
    }
  }
}
