import { Test, TestingModule } from '@nestjs/testing';
import { SocialAccountRepository } from '../database/repositories/social-account.repository';
import { EncryptionService } from '../encryption/encryption.service';
import { UserService } from '../user/user.service';
import { SocialAccountService } from './social-account.service';

describe('SocialAccountService', () => {
  let service: SocialAccountService;

  const mockSocialAccountRepository = {
    upsert: jest.fn(),
    findMany: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockEncryptionService = {
    encrypt: jest.fn((val) => `encrypted_${val}`),
    decrypt: jest.fn((val) => val.replace('encrypted_', '')),
  };

  const mockUserService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialAccountService,
        {
          provide: SocialAccountRepository,
          useValue: mockSocialAccountRepository,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<SocialAccountService>(SocialAccountService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
