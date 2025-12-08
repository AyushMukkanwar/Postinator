import { Test, TestingModule } from '@nestjs/testing';
import { TwitterService } from './twitter.service';
import { ConfigService } from '@nestjs/config';
import { TwitterApi } from 'twitter-api-v2';

jest.mock('twitter-api-v2');

describe('TwitterService', () => {
  let service: TwitterService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'TWITTER_CLIENT_ID') return 'mock-client-id';
      if (key === 'TWITTER_CLIENT_SECRET') return 'mock-client-secret';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwitterService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TwitterService>(TwitterService);
    configService = module.get<ConfigService>(ConfigService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('postTweet', () => {
    it('should post a tweet successfully with valid tokens', async () => {
      const mockTweet = jest.fn().mockResolvedValue({ data: { id: '123' } });
      (TwitterApi as unknown as jest.Mock).mockImplementation(() => ({
        v2: { tweet: mockTweet },
      }));

      const result = await service.postTweet(
        'access-token',
        'refresh-token',
        new Date(Date.now() + 3600 * 1000), // Not expired
        'Hello World',
        jest.fn(),
      );

      expect(result).toEqual({ tweetId: '123' });
      expect(mockTweet).toHaveBeenCalledWith('Hello World');
    });

    it('should refresh token if expired', async () => {
      const mockRefresh = jest.fn().mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      });
      const mockTweet = jest.fn().mockResolvedValue({ data: { id: '123' } });

      (TwitterApi as unknown as jest.Mock).mockImplementation((token) => {
        if (typeof token === 'object') {
          return { refreshOAuth2Token: mockRefresh };
        }
        return { v2: { tweet: mockTweet } };
      });

      const updateTokens = jest.fn();

      const result = await service.postTweet(
        'old-access-token',
        'old-refresh-token',
        new Date(Date.now() - 1000), // Expired
        'Hello World',
        updateTokens,
      );

      expect(mockRefresh).toHaveBeenCalledWith('old-refresh-token');
      expect(updateTokens).toHaveBeenCalledWith(
        'new-access-token',
        'new-refresh-token',
        expect.any(Date),
      );
      expect(result).toEqual({ tweetId: '123' });
    });

    it('should refresh token and retry if 401 error occurs', async () => {
      const mockRefresh = jest.fn().mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      });
      const mockTweet = jest
        .fn()
        .mockRejectedValueOnce({ code: 401 }) // First call fails
        .mockResolvedValueOnce({ data: { id: '123' } }); // Retry succeeds

      (TwitterApi as unknown as jest.Mock).mockImplementation((token) => {
        if (typeof token === 'object') {
          return { refreshOAuth2Token: mockRefresh };
        }
        return { v2: { tweet: mockTweet } };
      });

      const updateTokens = jest.fn();

      const result = await service.postTweet(
        'access-token',
        'refresh-token',
        new Date(Date.now() + 3600 * 1000), // Not expired
        'Hello World',
        updateTokens,
      );

      expect(mockRefresh).toHaveBeenCalledWith('refresh-token');
      expect(updateTokens).toHaveBeenCalledWith(
        'new-access-token',
        'new-refresh-token',
        expect.any(Date),
      );
      expect(result).toEqual({ tweetId: '123' });
    });
  });
});
