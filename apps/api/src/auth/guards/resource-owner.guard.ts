import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from 'generated/prisma';

@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: User }>();
    const { params, user: currentUser } = request;

    if (!currentUser || !currentUser.id) {
      throw new ForbiddenException('Authentication required');
    }

    const controllerName = context.getClass().name;

    if (controllerName === 'UserController') {
      const resourceId = params.id;
      if (resourceId) {
        const userResource = await this.prisma.user.findUnique({
          where: { id: resourceId },
        });
        if (!userResource) {
          throw new NotFoundException('User not found');
        }
        if (userResource.id === currentUser.id) {
          return true;
        }
      }

      const resourceEmail = params.email;
      if (resourceEmail) {
        const userResource = await this.prisma.user.findUnique({
          where: { email: resourceEmail },
        });
        if (!userResource) {
          throw new NotFoundException('User not found');
        }
        if (userResource.id === currentUser.id) {
          return true;
        }
      }
    } else if (controllerName === 'SocialAccountController') {
      const resourceId = params.id;
      if (!resourceId) {
        throw new ForbiddenException(
          'Resource ID not found in request parameters'
        );
      }

      const socialAccount = await this.prisma.socialAccount.findUnique({
        where: { id: resourceId },
        select: { userId: true },
      });

      if (!socialAccount) {
        throw new NotFoundException('Social account not found');
      }

      if (socialAccount.userId === currentUser.id) {
        return true;
      }
    }

    throw new ForbiddenException(
      'You do not have permission to access this resource'
    );
  }
}
