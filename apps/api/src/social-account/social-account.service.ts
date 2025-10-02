import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Prisma, SocialAccount } from '../../generated/prisma';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';
import { SocialAccountRepository } from 'src/database/repositories/social-account.repository';
import { EncryptionService } from 'src/encryption/encryption.service';
import { UserService } from 'src/user/user.service';

export type StrippedSocialAccount = Omit<
  SocialAccount,
  'accessSecret' | 'refreshToken'
>;

@Injectable()
export class SocialAccountService {
  constructor(
    private readonly socialAccountRepository: SocialAccountRepository,
    private readonly encryptionService: EncryptionService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService
  ) {}

  private decryptAccountTokens(account: SocialAccount): SocialAccount {
    const decryptedAccount = { ...account };

    decryptedAccount.accessToken = this.encryptionService.decrypt(
      account.accessToken
    );
    if (account.accessSecret) {
      decryptedAccount.accessSecret = this.encryptionService.decrypt(
        account.accessSecret
      );
    }
    if (account.refreshToken) {
      decryptedAccount.refreshToken = this.encryptionService.decrypt(
        account.refreshToken
      );
    }
    return decryptedAccount;
  }

  private stripSensitiveData(account: SocialAccount): StrippedSocialAccount {
    const { accessSecret, refreshToken, ...result } = account;
    return result;
  }

  async upsert(
    createSocialAccountDto: CreateSocialAccountDto,
    userId: string
  ): Promise<StrippedSocialAccount> {
    const {
      platform,
      tokenType,
      accessToken,
      accessSecret,
      refreshToken,
      expiresIn,
      ...rest
    } = createSocialAccountDto;

    const data: Prisma.SocialAccountUncheckedCreateInput = {
      ...rest,
      platform,
      tokenType,
      accessToken: this.encryptionService.encrypt(accessToken),
      accessSecret: accessSecret
        ? this.encryptionService.encrypt(accessSecret)
        : null,
      refreshToken: refreshToken
        ? this.encryptionService.encrypt(refreshToken)
        : null,
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
      userId,
    };

    const socialAccount = await this.socialAccountRepository.upsert({
      where: { userId_platform: { userId, platform } },
      update: data,
      create: data,
    });

    if (!socialAccount) {
      throw new NotFoundException('Could not create or update social account');
    }

    return this.stripSensitiveData(socialAccount);
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.SocialAccountWhereInput;
    orderBy?: Prisma.SocialAccountOrderByWithRelationInput;
  }): Promise<StrippedSocialAccount[]> {
    const accounts = await this.socialAccountRepository.findMany(params);
    return accounts.map((account) => this.stripSensitiveData(account));
  }

  async findByOAuthToken(oauthToken: string): Promise<SocialAccount> {
    const accounts = await this.socialAccountRepository.findMany({
      where: { accessToken: this.encryptionService.encrypt(oauthToken) },
    });

    if (!accounts || accounts.length === 0) {
      throw new NotFoundException(
        'Social account with the provided OAuth token not found'
      );
    }

    const account = accounts[0];
    if (!account) {
      throw new NotFoundException('Social account not found');
    }

    return this.decryptAccountTokens(account);
  }

  async findOne(id: string): Promise<StrippedSocialAccount> {
    const socialAccount = await this.socialAccountRepository.findById(id);
    if (!socialAccount) {
      throw new NotFoundException(`Social account with ID ${id} not found`);
    }
    return this.stripSensitiveData(socialAccount);
  }

  async findOneDecrypted(id: string): Promise<SocialAccount> {
    const socialAccount = await this.socialAccountRepository.findById(id);
    if (!socialAccount) {
      throw new NotFoundException(`Social account with ID ${id} not found`);
    }
    return this.decryptAccountTokens(socialAccount);
  }

  async update(
    id: string,
    updateSocialAccountDto: UpdateSocialAccountDto
  ): Promise<StrippedSocialAccount> {
    const { accessToken, accessSecret, refreshToken, expiresIn, ...rest } =
      updateSocialAccountDto;

    const dataToUpdate: Prisma.SocialAccountUpdateInput = { ...rest };

    if (accessToken) {
      dataToUpdate.accessToken = this.encryptionService.encrypt(accessToken);
    }
    if (accessSecret) {
      dataToUpdate.accessSecret = this.encryptionService.encrypt(accessSecret);
    }
    if (refreshToken) {
      dataToUpdate.refreshToken = this.encryptionService.encrypt(refreshToken);
    }
    if (expiresIn) {
      dataToUpdate.expiresAt = new Date(Date.now() + expiresIn * 1000);
    }

    const updatedAccount = await this.socialAccountRepository.update(
      id,
      dataToUpdate
    );

    if (!updatedAccount) {
      throw new NotFoundException(
        `Could not update social account with ID ${id}`
      );
    }

    return this.stripSensitiveData(updatedAccount);
  }

  async remove(id: string): Promise<SocialAccount> {
    return this.socialAccountRepository.delete(id);
  }
}
