import {
  Body,
  Controller,
  Get,
  Post as PostMapping,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOkResponse } from '@nestjs/swagger';
import { CreatePostDto } from './dto/create-post.dto';
import { PostEntity } from './entities/post.entity';
import { PostService } from './post.service';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @UseGuards(AuthGuard('jwt'))
  @PostMapping()
  @ApiOkResponse({ type: PostEntity })
  async create(
    @Body() createPostDto: CreatePostDto,
    @Req() req
  ): Promise<PostEntity> {
    const userId = req.user.id;
    const result = await this.postService.create(userId, createPostDto);
    return result;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  @ApiOkResponse({ type: [PostEntity] })
  async getPostsByStatus(
    @Req() req,
    @Query('status') status: string
  ): Promise<PostEntity[]> {
    const userId = req.user.id;
    return this.postService.getPostsByStatus(userId, status);
  }
}
