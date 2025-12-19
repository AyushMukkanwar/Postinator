import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SocialAccount, TokenType, User as UserModel } from '@repo/database';
import { ResourceParamName } from 'src/auth/decorators/resource-param.decorator';
import { User } from 'src/auth/decorators/user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt.auth.guard';
import { ResourceOwnerGuard } from 'src/auth/guards/resource-owner.guard';
import { LinkedinService } from 'src/linkedin/linkedin.service';
import { TwitterService } from '../twitter/twitter.service';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { LinkedInAccessTokenDto } from './dto/linkedin-access-token.dto';
import { TwitterAccessTokenDto } from './dto/twitter-access-token.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';
import { SocialAccountEntity } from './entities/social-account.entity';
import {
  SocialAccountService,
  StrippedSocialAccount,
} from './social-account.service';

@ApiTags('social-account')
@UseGuards(JwtAuthGuard)
@Controller('social-account')
export class SocialAccountController {
  constructor(
    private readonly socialAccountService: SocialAccountService,
    private readonly twitterService: TwitterService,
    private readonly linkedinService: LinkedinService
  ) {}

  @Post('upsert')
  @ApiOperation({ summary: 'Create or update a social account' })
  @ApiResponse({
    status: 200,
    description: 'Social account created or updated successfully',
    type: SocialAccountEntity,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async upsert(
    @Body() createSocialAccountDto: CreateSocialAccountDto,
    @User() user: UserModel
  ): Promise<StrippedSocialAccount> {
    const userId = user.id;
    return this.socialAccountService.upsert(createSocialAccountDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all social accounts' })
  @ApiResponse({
    status: 200,
    description: 'Social accounts retrieved successfully',
    type: [SocialAccountEntity],
  })
  async findAll(): Promise<StrippedSocialAccount[]> {
    return this.socialAccountService.findAll();
  }

  @Get('user/me')
  @ApiOperation({ summary: 'Get all social accounts for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Social accounts retrieved successfully',
    type: [SocialAccountEntity],
  })
  async findMine(@User() user: UserModel): Promise<StrippedSocialAccount[]> {
    const userId = user.id;
    return this.socialAccountService.findAll({ where: { userId } });
  }

  @Get(':id')
  @UseGuards(ResourceOwnerGuard)
  @ResourceParamName('id')
  @ApiOperation({ summary: 'Get social account by ID' })
  @ApiResponse({
    status: 200,
    description: 'Social account retrieved successfully',
    type: SocialAccountEntity,
  })
  @ApiResponse({ status: 404, description: 'Social account not found' })
  @ApiParam({ name: 'id', type: 'string', description: 'Social Account ID' })
  async findOne(@Param('id') id: string): Promise<StrippedSocialAccount> {
    return this.socialAccountService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(ResourceOwnerGuard)
  @ResourceParamName('id')
  @ApiOperation({ summary: 'Update social account by ID' })
  @ApiResponse({
    status: 200,
    description: 'Social account updated successfully',
    type: SocialAccountEntity,
  })
  @ApiResponse({ status: 404, description: 'Social account not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiParam({ name: 'id', type: 'string', description: 'Social Account ID' })
  async update(
    @Param('id') id: string,
    @Body() updateSocialAccountDto: UpdateSocialAccountDto
  ): Promise<StrippedSocialAccount> {
    return this.socialAccountService.update(id, updateSocialAccountDto);
  }

  @Delete(':id')
  @UseGuards(ResourceOwnerGuard)
  @ResourceParamName('id')
  @ApiOperation({ summary: 'Delete social account by ID' })
  @ApiResponse({
    status: 200,
    description: 'Social account deleted successfully',
    type: SocialAccountEntity,
  })
  @ApiResponse({ status: 404, description: 'Social account not found' })
  @ApiParam({ name: 'id', type: 'string', description: 'Social Account ID' })
  async remove(@Param('id') id: string): Promise<SocialAccount> {
    return this.socialAccountService.remove(id);
  }

  @Get('twitter/request-token')
  @ApiOperation({ summary: 'Get Twitter OAuth 2.0 authorization URL' })
  @ApiResponse({
    status: 200,
    description: 'Twitter authorization URL retrieved successfully',
  })
  async getRequestToken() {
    return this.twitterService.getAuthorizationUrl();
  }

  @Post('twitter/access-token')
  @ApiOperation({
    summary: 'Get Twitter access token and create social account',
  })
  @ApiResponse({
    status: 200,
    description:
      'Twitter access token retrieved and social account created successfully',
  })
  async getAccessToken(
    @Body()
    body: TwitterAccessTokenDto,
    @User() user: UserModel
  ) {
    console.log('SocialAccountController.getAccessToken body:', body);
    const { code, codeVerifier, redirectUri } = body;
    const {
      accessToken,
      refreshToken,
      expiresIn,
      userId,
      username,
      name,
      profileImageUrl,
    } = await this.twitterService.login(code, codeVerifier, redirectUri);

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const socialAccount = await this.socialAccountService.upsert(
      {
        platform: 'TWITTER',
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiresAt: expiresAt,
        platformId: userId,
        displayName: name,
        username,
        avatar: profileImageUrl,
        tokenType: TokenType.OAUTH2,
        isActive: true,
      },
      user.id
    );

    return socialAccount;
  }

  @Get('linkedin/auth-url')
  @ApiOperation({ summary: 'Get LinkedIn OAuth 2.0 authorization URL' })
  @ApiResponse({
    status: 200,
    description: 'LinkedIn authorization URL retrieved successfully',
  })
  getLinkedInAuthUrl() {
    return this.linkedinService.getAuthorizationUrl();
  }

  @Post('linkedin/access-token')
  @ApiOperation({
    summary: 'Get LinkedIn access token and create social account',
  })
  @ApiResponse({
    status: 200,
    description:
      'LinkedIn access token retrieved and social account created successfully',
  })
  async getLinkedInAccessToken(
    @Body() body: LinkedInAccessTokenDto,
    @User() user: UserModel
  ) {
    try {
      const { code, redirectUri } = body;
      const { accessToken, expiresIn, platformId, name, picture } =
        await this.linkedinService.login(code, redirectUri);

      // LinkedIn tokens last 60 days
      const expiresAt = new Date(Date.now() + expiresIn * 1000);
      const refreshTokenExpiresAt = expiresAt;

      const socialAccount = await this.socialAccountService.upsert(
        {
          platform: 'LINKEDIN',
          accessToken: accessToken,
          refreshToken: undefined,
          expiresAt: expiresAt,
          refreshTokenExpiresAt: refreshTokenExpiresAt,
          platformId: platformId,
          displayName: name,
          username: name,
          avatar: picture,
          tokenType: TokenType.OAUTH2,
          isActive: true,
        },
        user.id
      );

      return socialAccount;
    } catch (error) {
      console.error('LinkedIn Access Token Error:', error);
      throw error;
    }
  }
}
