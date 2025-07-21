import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';
import { SocialAccountRepository } from 'src/database/repositories/social-account.repository';

@Injectable()
export class SocialAccountService {
  constructor(
    private readonly socialAccountRepository: SocialAccountRepository
  ) {}

  async create(createSocialAccountDto: CreateSocialAccountDto, userId: string) {
    const { platform, ...rest } = createSocialAccountDto;

    // Check if a social account for this user and platform already exists
    const existingAccount = await this.socialAccountRepository.findUnique({
      userId_platform: {
        userId: userId,
        platform: platform,
      },
    });

    if (existingAccount) {
      throw new ConflictException(
        `User already has a social account for platform ${platform}`
      );
    }

    const data: Prisma.SocialAccountCreateInput = {
      ...rest,
      platform,
      user: {
        connect: {
          id: userId,
        },
      },
    };
    return this.socialAccountRepository.create(data);
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.SocialAccountWhereInput;
    orderBy?: Prisma.SocialAccountOrderByWithRelationInput;
  }) {
    return this.socialAccountRepository.findMany(params);
  }

  async findOne(id: string) {
    const socialAccount = await this.socialAccountRepository.findById(id);
    if (!socialAccount) {
      throw new NotFoundException(`Social account with ID ${id} not found`);
    }
    return socialAccount;
  }

  async update(id: string, updateSocialAccountDto: UpdateSocialAccountDto) {
    return this.socialAccountRepository.update(id, updateSocialAccountDto);
  }

  async remove(id: string) {
    return this.socialAccountRepository.delete(id);
  }
}
