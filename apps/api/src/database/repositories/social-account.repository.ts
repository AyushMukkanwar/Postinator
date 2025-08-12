import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SocialAccount, Prisma } from 'generated/prisma';
import { BaseRepository } from './base.repository';

export interface ISocialAccountRepository
  extends BaseRepository<
    SocialAccount,
    Prisma.SocialAccountCreateInput,
    Prisma.SocialAccountUpdateInput,
    Prisma.SocialAccountWhereInput
  > {
  findUnique(
    where: Prisma.SocialAccountWhereUniqueInput
  ): Promise<SocialAccount | null>;
  upsert(args: Prisma.SocialAccountUpsertArgs): Promise<SocialAccount | null>;
}

@Injectable()
export class SocialAccountRepository implements ISocialAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(
    args: Prisma.SocialAccountUpsertArgs
  ): Promise<SocialAccount | null> {
    return this.prisma.socialAccount.upsert(args);
  }

  async create(data: Prisma.SocialAccountCreateInput): Promise<SocialAccount> {
    return this.prisma.socialAccount.create({
      data,
    });
  }

  async findById(id: string): Promise<SocialAccount | null> {
    return this.prisma.socialAccount.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  async findUnique(
    where: Prisma.SocialAccountWhereUniqueInput
  ): Promise<SocialAccount | null> {
    return this.prisma.socialAccount.findUnique({
      where,
    });
  }

  async update(
    id: string,
    data: Prisma.SocialAccountUpdateInput
  ): Promise<SocialAccount> {
    return this.prisma.socialAccount.update({
      where: { id },
      data,
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

  async delete(id: string): Promise<SocialAccount> {
    return this.prisma.socialAccount.delete({
      where: { id },
    });
  }

  async count(where?: Prisma.SocialAccountWhereInput): Promise<number> {
    return this.prisma.socialAccount.count({ where });
  }
}
