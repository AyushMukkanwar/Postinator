// src/database/repositories/social-account.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SocialAccount, Prisma, Platform } from 'generated/prisma';
import { BaseRepository } from './base.repository';

export interface ISocialAccountRepository extends BaseRepository<
  SocialAccount,
  Prisma.SocialAccountCreateInput,
  Prisma.SocialAccountUpdateInput,
  Prisma.SocialAccountWhereInput
> {
  findByUserAndPlatform(userId: string, platform: Platform): Promise<SocialAccount | null>;
  findActiveByUser(userId: string): Promise<SocialAccount[]>;
  findByPlatformId(platformId: string, platform: Platform): Promise<SocialAccount | null>;
  updateTokens(id: string, accessToken: string, refreshToken?: string, expiresAt?: Date): Promise<SocialAccount>;
  deactivateAccount(id: string): Promise<SocialAccount>;
}

@Injectable()
export class SocialAccountRepository implements ISocialAccountRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.SocialAccountCreateInput): Promise<SocialAccount> {
    return this.prisma.socialAccount.create({ data });
  }

  async findById(id: string): Promise<SocialAccount | null> {
    return this.prisma.socialAccount.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  async findByUserAndPlatform(userId: string, platform: Platform): Promise<SocialAccount | null> {
    return this.prisma.socialAccount.findUnique({
      where: {
        userId_platform: {
          userId,
          platform,
        },
      },
    });
  }

  async findActiveByUser(userId: string): Promise<SocialAccount[]> {
    return this.prisma.socialAccount.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByPlatformId(platformId: string, platform: Platform): Promise<SocialAccount | null> {
    return this.prisma.socialAccount.findFirst({
      where: {
        platformId,
        platform,
      },
    });
  }

  async updateTokens(
    id: string,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: Date
  ): Promise<SocialAccount> {
    return this.prisma.socialAccount.update({
      where: { id },
      data: {
        accessToken,
        refreshToken,
        expiresAt,
      },
    });
  }

  async deactivateAccount(id: string): Promise<SocialAccount> {
    return this.prisma.socialAccount.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findMany(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.SocialAccountWhereInput;
    orderBy?: Prisma.SocialAccountOrderByWithRelationInput;
  }): Promise<SocialAccount[]> {
    const { skip, take, where, orderBy } = params || {};
    return this.prisma.socialAccount.findMany({
      skip,
      take,
      where,
      orderBy,
    });
  }

  async update(id: string, data: Prisma.SocialAccountUpdateInput): Promise<SocialAccount> {
    return this.prisma.socialAccount.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<SocialAccount> {
    return this.prisma.socialAccount.delete({
      where: { id },
    });
  }

  async count(where?: Prisma.SocialAccountWhereInput): Promise<number> {
    return this.prisma.socialAccount.count({ where });
  }
}