import { Test, TestingModule } from '@nestjs/testing';
import { SocialAccountController } from './social-account.controller';
import { SocialAccountService } from './social-account.service';
import { TwitterService } from '../twitter/twitter.service';
import { TwitterAccessTokenDto } from './dto/twitter-access-token.dto';
import { TokenType } from '@repo/database';
import { PrismaService } from '../prisma/prisma.service';
import { ResourceOwnerGuard } from '../auth/guards/resource-owner.guard';

describe('SocialAccountController', () => {
  let controller: SocialAccountController;
  let socialAccountService: SocialAccountService;
  let twitterService: TwitterService;

  const mockSocialAccountService = {
    upsert: jest.fn(),
  };

  const mockTwitterService = {
    getAuthorizationUrl: jest.fn(),
    login: jest.fn(),
  };

  const mockPrismaService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SocialAccountController],
      providers: [
        { provide: SocialAccountService, useValue: mockSocialAccountService },
        { provide: TwitterService, useValue: mockTwitterService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    })
      .overrideGuard(ResourceOwnerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SocialAccountController>(SocialAccountController);
    socialAccountService =
      module.get<SocialAccountService>(SocialAccountService);
    twitterService = module.get<TwitterService>(TwitterService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getRequestToken', () => {
    it('should return authorization URL', async () => {
      const mockAuthResult = {
        url: 'https://twitter.com/auth',
        codeVerifier: 'verifier',
        state: 'state',
      };
      mockTwitterService.getAuthorizationUrl.mockReturnValue(mockAuthResult);

      const result = await controller.getRequestToken();

      expect(twitterService.getAuthorizationUrl).toHaveBeenCalled();
      expect(result).toEqual(mockAuthResult);
    });
  });

  describe('getAccessToken', () => {
    it('should exchange code for access token and create social account', async () => {
      const dto: TwitterAccessTokenDto = {
        code: 'auth-code',
        state: 'state',
        codeVerifier: 'verifier',
        redirectUri: 'http://localhost/callback',
      };

      const mockUser = { id: 'user-1' } as any;

      const mockLoginResult = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        userId: 'twitter-user-1',
        username: 'twitteruser',
        name: 'Twitter User',
        profileImageUrl: 'http://image.url',
      };

      mockTwitterService.login.mockResolvedValue(mockLoginResult);
      mockSocialAccountService.upsert.mockResolvedValue({ id: 'account-1' });

      const result = await controller.getAccessToken(dto, mockUser);

      expect(twitterService.login).toHaveBeenCalledWith(
        dto.code,
        dto.codeVerifier,
        dto.redirectUri
      );

      expect(socialAccountService.upsert).toHaveBeenCalledWith(
        {
          platform: 'TWITTER',
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresAt: expect.any(Date),
          platformId: 'twitter-user-1',
          displayName: 'Twitter User',
          username: 'twitteruser',
          avatar: 'http://image.url',
          tokenType: TokenType.OAUTH2,
        },
        'user-1'
      );

      expect(result).toEqual({ id: 'account-1' });
    });
  });
});
