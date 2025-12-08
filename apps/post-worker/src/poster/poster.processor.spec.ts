import { Test, TestingModule } from '@nestjs/testing';
import { PosterProcessor } from './poster.processor';
import { PrismaService } from '../prisma/prisma.service';
import { TwitterService } from './twitter.service';
import { EncryptionService } from '../encryption/encryption.service';
import { Job } from 'bullmq';

describe('PosterProcessor', () => {
  let processor: PosterProcessor;
  let prismaService: PrismaService;
  let twitterService: TwitterService;
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

  const mockTwitterService = {
    postTweet: jest.fn(),
  };

  const mockEncryptionService = {
    decrypt: jest.fn((val) => `decrypted-${val}`),
    encrypt: jest.fn((val) => `encrypted-${val}`),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosterProcessor,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TwitterService, useValue: mockTwitterService },
        { provide: EncryptionService, useValue: mockEncryptionService },
      ],
    }).compile();

    processor = module.get<PosterProcessor>(PosterProcessor);
    prismaService = module.get<PrismaService>(PrismaService);
    twitterService = module.get<TwitterService>(TwitterService);
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
          expiresAt: new Date(),
        },
      };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockTwitterService.postTweet.mockResolvedValue({ tweetId: 'tweet-1' });

      await processor.process(job);

      expect(mockEncryptionService.decrypt).toHaveBeenCalledWith('enc-access');
      expect(mockEncryptionService.decrypt).toHaveBeenCalledWith('enc-refresh');
      expect(mockTwitterService.postTweet).toHaveBeenCalledWith(
        'decrypted-enc-access',
        'decrypted-enc-refresh',
        mockPost.socialAccount.expiresAt,
        'Hello World',
        expect.any(Function),
      );
      expect(mockPrismaService.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
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

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockTwitterService.postTweet.mockImplementation(
        async (at, rt, exp, text, callback) => {
          await callback('new-access', 'new-refresh', new Date());
          return { tweetId: 'tweet-1' };
        },
      );

      await processor.process(job);

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
