// src/database/repositories/post.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Post, Prisma, PostStatus, Platform } from 'generated/prisma';
import { BaseRepository } from './base.repository';

export interface IPostRepository
  extends BaseRepository<
    Post,
    Prisma.PostCreateInput,
    Prisma.PostUpdateInput,
    Prisma.PostWhereInput
  > {
  findScheduledPosts(beforeDate?: Date): Promise<Post[]>;
  findByUserAndStatus(userId: string, status: PostStatus): Promise<Post[]>;
  findByPlatformAndStatus(
    platform: Platform,
    status: PostStatus
  ): Promise<Post[]>;
  updateStatus(
    id: string,
    status: PostStatus,
    platformPostId?: string,
    errorMessage?: string
  ): Promise<Post>;
  markAsPublished(id: string, platformPostId: string): Promise<Post>;
  markAsFailed(id: string, errorMessage: string): Promise<Post>;
  findPendingForSocialAccount(socialAccountId: string): Promise<Post[]>;
}

@Injectable()
export class PostRepository implements IPostRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.PostCreateInput): Promise<Post> {
    return this.prisma.post.create({
      data,
      include: {
        user: true,
        socialAccount: true,
      },
    });
  }

  async findById(id: string): Promise<Post | null> {
    return this.prisma.post.findUnique({
      where: { id },
      include: {
        user: true,
        socialAccount: true,
      },
    });
  }

  async findScheduledPosts(beforeDate = new Date()): Promise<Post[]> {
    return this.prisma.post.findMany({
      where: {
        status: PostStatus.SCHEDULED,
        scheduledFor: {
          lte: beforeDate,
        },
        socialAccount: {
          isActive: true,
        },
      },
      include: {
        user: true,
        socialAccount: true,
      },
      orderBy: { scheduledFor: 'asc' },
    });
  }

  async findByUserAndStatus(
    userId: string,
    status: PostStatus
  ): Promise<Post[]> {
    return this.prisma.post.findMany({
      where: {
        userId,
        status,
      },
      include: {
        socialAccount: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByPlatformAndStatus(
    platform: Platform,
    status: PostStatus
  ): Promise<Post[]> {
    return this.prisma.post.findMany({
      where: {
        platform,
        status,
      },
      include: {
        user: true,
        socialAccount: true,
      },
      orderBy: { scheduledFor: 'asc' },
    });
  }

  async findPendingForSocialAccount(socialAccountId: string): Promise<Post[]> {
    return this.prisma.post.findMany({
      where: {
        socialAccountId,
        status: {
          in: [PostStatus.SCHEDULED, PostStatus.PUBLISHING],
        },
      },
      orderBy: { scheduledFor: 'asc' },
    });
  }

  async updateStatus(
    id: string,
    status: PostStatus,
    platformPostId?: string,
    errorMessage?: string
  ): Promise<Post> {
    return this.prisma.post.update({
      where: { id },
      data: {
        status,
        platformPostId,
        errorMessage,
        publishedAt: status === PostStatus.PUBLISHED ? new Date() : undefined,
      },
    });
  }

  async markAsPublished(id: string, platformPostId: string): Promise<Post> {
    return this.updateStatus(id, PostStatus.PUBLISHED, platformPostId);
  }

  async markAsFailed(id: string, errorMessage: string): Promise<Post> {
    return this.updateStatus(id, PostStatus.FAILED, undefined, errorMessage);
  }

  async findMany(params?: Prisma.PostFindManyArgs): Promise<Post[]> {
    const { skip, take, where, orderBy } = params || {};
    return this.prisma.post.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        user: true,
        socialAccount: true,
      },
    });
  }

  async update(id: string, data: Prisma.PostUpdateInput): Promise<Post> {
    return this.prisma.post.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Post> {
    return this.prisma.post.delete({
      where: { id },
    });
  }

  async count(where?: Prisma.PostWhereInput): Promise<number> {
    return this.prisma.post.count({ where });
  }
}
