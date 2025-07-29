import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';
import { SocialAccountRepository } from 'src/database/repositories/social-account.repository';
import { EncryptionService } from 'src/encryption/encryption.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class SocialAccountService {
  constructor(
    private readonly socialAccountRepository: SocialAccountRepository,
    private readonly encryptionService: EncryptionService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService
  ) {}

  async create(createSocialAccountDto: CreateSocialAccountDto, userId: string) {
    const { platform, accessToken, refreshToken, ...rest } =
      createSocialAccountDto;

    // Check if a social account for this user and platform already exists
    const existingAccount = await this.socialAccountRepository.findUnique({
      userId_platform: {
        userId,
        platform,
      },
    });

    if (existingAccount) {
      throw new ConflictException(
        `User already has a social account for platform ${platform}`
      );
    }

    const encryptedAccessToken = this.encryptionService.encrypt(accessToken);
    const encryptedRefreshToken = refreshToken
      ? this.encryptionService.encrypt(refreshToken)
      : null;

    const data: Prisma.SocialAccountCreateInput = {
      ...rest,
      platform,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      user: {
        connect: {
          id: userId,
        },
      },
    };
    try {
      const newAccount = await this.socialAccountRepository.create(data);

      // Decrypt tokens before returning to the client
      newAccount.accessToken = this.encryptionService.decrypt(
        newAccount.accessToken
      );
      if (newAccount.refreshToken) {
        newAccount.refreshToken = this.encryptionService.decrypt(
          newAccount.refreshToken
        );
      }

      return newAccount;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.SocialAccountWhereInput;
    orderBy?: Prisma.SocialAccountOrderByWithRelationInput;
  }) {
    const accounts = await this.socialAccountRepository.findMany(params);

    // Decrypt tokens for all accounts
    return accounts.map((account) => {
      account.accessToken = this.encryptionService.decrypt(account.accessToken);
      if (account.refreshToken) {
        account.refreshToken = this.encryptionService.decrypt(
          account.refreshToken
        );
      }
      return account;
    });
  }

  async findOne(id: string) {
    const socialAccount = await this.socialAccountRepository.findById(id);
    if (!socialAccount) {
      throw new NotFoundException(`Social account with ID ${id} not found`);
    }

    // Decrypt tokens
    socialAccount.accessToken = this.encryptionService.decrypt(
      socialAccount.accessToken
    );
    if (socialAccount.refreshToken) {
      socialAccount.refreshToken = this.encryptionService.decrypt(
        socialAccount.refreshToken
      );
    }

    return socialAccount;
  }

  async update(id: string, updateSocialAccountDto: UpdateSocialAccountDto) {
    const { accessToken, refreshToken, ...rest } = updateSocialAccountDto;

    const dataToUpdate: Prisma.SocialAccountUpdateInput = { ...rest };

    if (accessToken) {
      dataToUpdate.accessToken = this.encryptionService.encrypt(accessToken);
    }

    if (refreshToken) {
      dataToUpdate.refreshToken = this.encryptionService.encrypt(refreshToken);
    }

    const updatedAccount = await this.socialAccountRepository.update(
      id,
      dataToUpdate
    );

    // Decrypt tokens before returning
    updatedAccount.accessToken = this.encryptionService.decrypt(
      updatedAccount.accessToken
    );
    if (updatedAccount.refreshToken) {
      updatedAccount.refreshToken = this.encryptionService.decrypt(
        updatedAccount.refreshToken
      );
    }

    return updatedAccount;
  }

  async remove(id: string) {
    return this.socialAccountRepository.delete(id);
  }
}
