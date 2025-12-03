import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User as UserModel } from '@repo/database';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserModel => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
