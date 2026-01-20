import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Platform,
  PlatformLimits,
  Post,
  PostStatus,
  SUBSCRIPTION_PLANS,
} from '@repo/database';
import { Cache } from 'cache-manager';
import { PostRepository } from 'src/database/repositories/post.repository';
import { SocialAccountRepository } from 'src/database/repositories/social-account.repository';
import { UserRepository } from 'src/database/repositories/user.repository';
import { PostQueueService } from '../queue/post-queue.service';

@Injectable()
export class PostService {
  constructor(
    private postRepository: PostRepository,
    private socialAccountRepository: SocialAccountRepository,
    private postQueueService: PostQueueService,
    private userRepository: UserRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async schedulePost(data: {
    userId: string;
    socialAccountId: string;
    content: string;
    scheduledFor: Date;
    platform: Platform;
    media?: string[];
  }): Promise<Post> {
    // Validate social account belongs to user and is active
    const socialAccount = await this.socialAccountRepository.findById(
      data.socialAccountId
    );
    if (
      !socialAccount ||
      socialAccount.userId !== data.userId ||
      !socialAccount.isActive
    ) {
      throw new BadRequestException('Invalid or inactive social account');
    }

    if (socialAccount.platform !== data.platform) {
      throw new BadRequestException('Platform mismatch with social account');
    }

    const user = await this.userRepository.findById(data.userId);

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    let currentCount = user.postCountCurrentPeriod;
    let periodStart = user.currentPeriodStart;

    // Reset limit if more than a month is passed
    if (periodStart < monthAgo) {
      currentCount = 0;
      periodStart = new Date();
      await this.userRepository.update(user.id, {
        postCountCurrentPeriod: 0,
        currentPeriodStart: periodStart,
      });
    }

    const plan = SUBSCRIPTION_PLANS[user.subscriptionTier];
    const maxPosts = plan.limits.maxPostsPerMonth;
    if (currentCount >= maxPosts) {
      throw new BadRequestException(
        `Monthly post limit reached for ${plan.name} tier. Upgrade to PRO for unlimited posting!`
      );
    }

    // Validate Content Limits using Shared Config
    const limits = PlatformLimits[socialAccount.platform];
    if (data.content.length > limits.maxTextLength) {
      throw new BadRequestException(
        `Post content exceeds the ${limits.maxTextLength} character limit for ${socialAccount.platform}.`
      );
    }

    const post = await this.postRepository.create({
      content: data.content,
      scheduledFor: data.scheduledFor,
      platform: data.platform,
      user: { connect: { id: data.userId } },
      socialAccount: { connect: { id: data.socialAccountId } },
      media: data.media || [],
    });

    await this.postQueueService.addPostToQueue(post.id, post.scheduledFor);

    await this.invalidateUserPostsCache(data.userId);

    await this.userRepository.update(user.id, {
      postCountCurrentPeriod: currentCount + 1,
    });

    return post;

    // return await this.prismaService.$transaction(async (tx) => {

    // })
  }

  async create(
    userId: string,
    createPostDto: {
      content: string;
      scheduledFor: Date;
      socialAccountId: string;
      platform: Platform;
      media?: string[];
    }
  ): Promise<Post> {
    return this.schedulePost({
      userId,
      content: createPostDto.content,
      scheduledFor: createPostDto.scheduledFor,
      socialAccountId: createPostDto.socialAccountId,
      platform: createPostDto.platform,
      media: createPostDto.media,
    });
  }

  async getPostsReadyToPublish(): Promise<Post[]> {
    return this.postRepository.findScheduledPosts();
  }

  async getUserPosts(userId: string, status?: PostStatus): Promise<Post[]> {
    const cacheKey = `user-posts:${userId}:${status || 'all'}`;
    const cachedPosts = await this.cacheManager.get<Post[]>(cacheKey);
    if (cachedPosts) {
      return cachedPosts;
    }

    let posts: Post[];
    if (status) {
      posts = await this.postRepository.findByUserAndStatus(userId, status);
    } else {
      posts = await this.postRepository.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    }

    await this.cacheManager.set(cacheKey, posts);
    return posts;
  }

  async getPostsByStatus(userId: string, status: string): Promise<Post[]> {
    const postStatus = status.toUpperCase() as PostStatus;
    if (!Object.values(PostStatus).includes(postStatus)) {
      throw new BadRequestException('Invalid status');
    }
    return this.postRepository.findByUserAndStatus(userId, postStatus);
  }

  async updatePostStatus(
    id: string,
    status: PostStatus,
    platformPostId?: string,
    errorMessage?: string
  ): Promise<Post> {
    const post = await this.postRepository.updateStatus(
      id,
      status,
      platformPostId,
      errorMessage
    );
    await this.invalidatePostCache(id);
    await this.invalidateUserPostsCache(post.userId);
    return post;
  }

  async markPostAsPublished(id: string, platformPostId: string): Promise<Post> {
    const post = await this.postRepository.markAsPublished(id, platformPostId);
    await this.invalidatePostCache(id);
    await this.invalidateUserPostsCache(post.userId);
    return post;
  }

  async markPostAsFailed(id: string, errorMessage: string): Promise<Post> {
    const post = await this.postRepository.markAsFailed(id, errorMessage);
    await this.invalidatePostCache(id);
    await this.invalidateUserPostsCache(post.userId);
    return post;
  }

  async cancelPost(id: string, userId: string): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    if (post.userId !== userId) {
      throw new BadRequestException('Unauthorized to cancel this post');
    }

    if (post.status !== PostStatus.SCHEDULED) {
      throw new BadRequestException('Can only cancel scheduled posts');
    }

    // If a post is cancelled, it should be removed from the queue
    await this.postQueueService.removePostFromQueue(id);

    const updatedPost = await this.postRepository.updateStatus(
      id,
      PostStatus.CANCELLED
    );
    await this.invalidatePostCache(id);
    await this.invalidateUserPostsCache(userId);
    return updatedPost;
  }

  async reschedulePost(
    id: string,
    userId: string,
    newScheduledTime: Date
  ): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    if (post.userId !== userId) {
      throw new BadRequestException('Unauthorized to reschedule this post');
    }

    if (post.status !== PostStatus.SCHEDULED) {
      throw new BadRequestException('Can only reschedule scheduled posts');
    }

    const updatedPost = await this.postRepository.update(id, {
      scheduledFor: newScheduledTime,
    });

    await this.postQueueService.updatePostInQueue(id, newScheduledTime);

    await this.invalidatePostCache(id);
    await this.invalidateUserPostsCache(userId);

    return updatedPost;
  }

  async getPostById(id: string): Promise<Post> {
    const cacheKey = `post:${id}`;
    const cachedPost = await this.cacheManager.get<Post>(cacheKey);
    if (cachedPost) {
      return cachedPost;
    }

    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    await this.cacheManager.set(cacheKey, post);
    return post;
  }

  async deletePost(id: string, userId: string): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    if (post.userId !== userId) {
      throw new BadRequestException('Unauthorized to delete this post');
    }

    // First, remove from queue, then delete from DB
    await this.postQueueService.removePostFromQueue(id);

    await this.invalidatePostCache(id);
    await this.invalidateUserPostsCache(userId);

    return this.postRepository.delete(id);
  }

  private async invalidatePostCache(id: string) {
    const cacheKey = `post:${id}`;
    await this.cacheManager.del(cacheKey);
  }

  private async invalidateUserPostsCache(userId: string) {
    // This is a bit naive. A better approach would be to invalidate all statuses.
    // For now, we'll just invalidate the general 'all' status cache.
    const cacheKey = `user-posts:${userId}:all`;
    await this.cacheManager.del(cacheKey);
  }
}
