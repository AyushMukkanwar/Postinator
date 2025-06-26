// src/modules/post/post.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PostRepository } from 'src/database/repositories/post.repository';
import { SocialAccountRepository } from 'src/database/repositories/social-account.repository';
import { Post, Prisma, PostStatus, Platform } from 'generated/prisma';

@Injectable()
export class PostService {
  constructor(
    private postRepository: PostRepository,
    private socialAccountRepository: SocialAccountRepository,
  ) {}

  async schedulePost(data: {
    userId: string;
    socialAccountId: string;
    content: string;
    scheduledFor: Date;
    platform: Platform;
  }): Promise<Post> {
    // Validate social account belongs to user and is active
    const socialAccount = await this.socialAccountRepository.findById(data.socialAccountId);
    if (!socialAccount || socialAccount.userId !== data.userId || !socialAccount.isActive) {
      throw new BadRequestException('Invalid or inactive social account');
    }

    if (socialAccount.platform !== data.platform) {
      throw new BadRequestException('Platform mismatch with social account');
    }

    return this.postRepository.create({
      content: data.content,
      scheduledFor: data.scheduledFor,
      platform: data.platform,
      user: { connect: { id: data.userId } },
      socialAccount: { connect: { id: data.socialAccountId } },
    });
  }

  async getPostsReadyToPublish(): Promise<Post[]> {
    return this.postRepository.findScheduledPosts();
  }

  async getUserPosts(userId: string, status?: PostStatus): Promise<Post[]> {
    if (status) {
      return this.postRepository.findByUserAndStatus(userId, status);
    }
    return this.postRepository.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updatePostStatus(
    id: string,
    status: PostStatus,
    platformPostId?: string,
    errorMessage?: string,
  ): Promise<Post> {
    return this.postRepository.updateStatus(id, status, platformPostId, errorMessage);
  }

  async markPostAsPublished(id: string, platformPostId: string): Promise<Post> {
    return this.postRepository.markAsPublished(id, platformPostId);
  }

  async markPostAsFailed(id: string, errorMessage: string): Promise<Post> {
    return this.postRepository.markAsFailed(id, errorMessage);
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

    return this.postRepository.updateStatus(id, PostStatus.CANCELLED);
  }

  async reschedulePost(id: string, userId: string, newScheduledTime: Date): Promise<Post> {
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

    return this.postRepository.update(id, {
      scheduledFor: newScheduledTime,
    });
  }

  async getPostById(id: string): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
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

    return this.postRepository.delete(id);
  }
}