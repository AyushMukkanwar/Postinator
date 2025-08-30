import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt.auth.guard';
import { User } from './auth/decorators/user.decorator';
import { User as UserModel } from '@repo/db/prisma/generated/prisma';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/protected')
  @UseGuards(JwtAuthGuard)
  protected(@User() user: UserModel) {
    return {
      message: 'AuthGuard works 🎉 from Turborepo API',
      authenticated_user: user,
    };
  }
}
