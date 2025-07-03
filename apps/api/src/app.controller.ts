import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt.auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
  };
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/protected')
  @UseGuards(JwtAuthGuard)
  protected(@Req() req: AuthenticatedRequest) {
    return {
      message: 'AuthGuard works 🎉 from Turborepo API',
      authenticated_user: req.user,
    };
  }
}
