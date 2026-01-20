import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { TwitterApi } from 'twitter-api-v2';
import { EncryptionService } from '../encryption/encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import { PosterProcessor } from './poster.processor';

jest.mock('twitter-api-v2');

describe('PosterProcessor', () => {
  let processor: PosterProcessor;
  let prismaService: PrismaService;
  let encryptionService: EncryptionService;

  const mockPrismaService = {
    post: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    socialAccount: {
      update: jest.fn(),
    },
  };

  const mockEncryptionService = {
    decrypt: jest.fn((val) => `decrypted-${val}`),
    encrypt: jest.fn((val) => `encrypted-${val}`),
  };

  const mockTwitterApi = {
    v2: {
      tweet: jest.fn().mockResolvedValue({ data: { id: 'tweet-1' } }),
    },
    refreshOAuth2Token: jest.fn(),
  };

  beforeEach(async () => {
    (TwitterApi as unknown as jest.Mock).mockImplementation(
      () => mockTwitterApi,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosterProcessor,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EncryptionService, useValue: mockEncryptionService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'TWITTER_CLIENT_ID') return 'mock-client-id';
              if (key === 'TWITTER_CLIENT_SECRET') return 'mock-client-secret';
              return null;
            }),
          },
        },
      ],
    }).compile();

    processor = module.get<PosterProcessor>(PosterProcessor);
    prismaService = module.get<PrismaService>(PrismaService);
    encryptionService = module.get<EncryptionService>(EncryptionService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should process a scheduled Twitter post', async () => {
      const job = { data: { postId: 'post-1' } } as Job;
      const mockPost = {
        id: 'post-1',
        content: 'Hello World',
        status: 'SCHEDULED',
        socialAccountId: 'account-1',
        socialAccount: {
          platform: 'TWITTER',
          accessToken: 'enc-access',
          refreshToken: 'enc-refresh',
          expiresAt: new Date(Date.now() + 1000 * 60 * 60), // Future
          id: 'account-1',
        },
      };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      await processor.process(job);

      expect(mockEncryptionService.decrypt).toHaveBeenCalledWith('enc-access');
      expect(mockEncryptionService.decrypt).toHaveBeenCalledWith('enc-refresh');
      // The strategy calls client.v2.tweet
      expect(mockTwitterApi.v2.tweet).toHaveBeenCalledWith('Hello World');

      expect(mockPrismaService.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        // The strategy returns { postId: tweetData.id } which is 'tweet-1' from our mock
        data: { status: 'PUBLISHED', platformPostId: 'tweet-1' },
      });
    });

    it('should update tokens when callback is called', async () => {
      const job = { data: { postId: 'post-1' } } as Job;
      const mockPost = {
        id: 'post-1',
        content: 'Hello World',
        status: 'SCHEDULED',
        socialAccountId: 'account-1',
        socialAccount: {
          platform: 'TWITTER',
          accessToken: 'enc-access',
          refreshToken: 'enc-refresh',
          expiresAt: new Date(),
        },
      };

      const mockPost2 = {
        id: 'post-1',
        content: 'Hello World',
        status: 'SCHEDULED',
        socialAccountId: 'account-1',
        socialAccount: {
          platform: 'TWITTER',
          accessToken: 'enc-access',
          refreshToken: 'enc-refresh',
          expiresAt: new Date(Date.now() - 10000), // Expired
          id: 'account-1',
        },
      };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost2);

      mockTwitterApi.refreshOAuth2Token.mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        expiresIn: 3600,
      });

      await processor.process(job);

      expect(mockTwitterApi.refreshOAuth2Token).toHaveBeenCalledWith(
        'decrypted-enc-refresh',
      );

      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('new-access');
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('new-refresh');
      expect(mockPrismaService.socialAccount.update).toHaveBeenCalledWith({
        where: { id: 'account-1' },
        data: {
          accessToken: 'encrypted-new-access',
          refreshToken: 'encrypted-new-refresh',
          expiresAt: expect.any(Date),
        },
      });
    });
  });
});
