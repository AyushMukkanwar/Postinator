import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SocialAccountService } from './social-account.service';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.auth.guard';
import { ResourceOwnerGuard } from 'src/auth/guards/resource-owner.guard';
import { ResourceParamName } from 'src/auth/decorators/resource-param.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SocialAccountEntity } from './entities/social-account.entity';

@ApiTags('social-account')
@UseGuards(JwtAuthGuard)
@Controller('social-account')
export class SocialAccountController {
  constructor(private readonly socialAccountService: SocialAccountService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new social account' })
  @ApiResponse({
    status: 201,
    description: 'Social account created successfully',
    type: SocialAccountEntity,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 409,
    description: 'Social account already exists for this platform',
  })
  create(
    @Body() createSocialAccountDto: CreateSocialAccountDto,
    @Request() req: any // Add request parameter to access user from JWT
  ) {
    const userId = req.user.sub; // Extract user ID from JWT token
    return this.socialAccountService.create(createSocialAccountDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all social accounts' })
  @ApiResponse({
    status: 200,
    description: 'Social accounts retrieved successfully',
    type: [SocialAccountEntity],
  })
  findAll() {
    return this.socialAccountService.findAll();
  }

  @Get(':id')
  @UseGuards(ResourceOwnerGuard) // Add this
  @ResourceParamName('id')
  @ApiOperation({ summary: 'Get social account by ID' })
  @ApiResponse({
    status: 200,
    description: 'Social account retrieved successfully',
    type: SocialAccountEntity,
  })
  @ApiResponse({ status: 404, description: 'Social account not found' })
  @ApiParam({ name: 'id', type: 'string', description: 'Social Account ID' })
  findOne(@Param('id') id: string) {
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
  update(
    @Param('id') id: string,
    @Body() updateSocialAccountDto: UpdateSocialAccountDto
  ) {
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
  remove(@Param('id') id: string) {
    return this.socialAccountService.remove(id);
  }
}
