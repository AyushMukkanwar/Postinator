import {
  Controller,
  Post as PostMapping,
  Body,
  UseGuards,
  Req,
  Get,
  Query,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { AuthGuard } from '@nestjs/passport';
import { Post } from '../../generated/prisma';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @UseGuards(AuthGuard('jwt'))
  @PostMapping()
  async create(
    @Body() createPostDto: CreatePostDto,
    @Req() req
  ): Promise<Post> {
    const userId = req.user.id;
    const result = await this.postService.create(userId, createPostDto);
    return result;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getPostsByStatus(
    @Req() req,
    @Query('status') status: string
  ): Promise<Post[]> {
    const userId = req.user.id;
    return this.postService.getPostsByStatus(userId, status);
  }
}
