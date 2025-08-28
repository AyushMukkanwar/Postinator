import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() createPostDto: CreatePostDto, @Req() req) {
    const userId = req.user.id;
    const result = await this.postService.create(userId, createPostDto);
    return result;
  }
}
