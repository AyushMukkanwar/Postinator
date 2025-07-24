// resource-owner.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserService } from 'src/user/user.service';
import { SocialAccountService } from 'src/social-account/social-account.service';

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string; // This is the user ID from JWT
    email: string;
  };
}

@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UserService,
    private socialAccountService: SocialAccountService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: AuthenticatedRequest = context.switchToHttp().getRequest();
    const { params, user: currentUser } = request;

    if (!currentUser || !currentUser.sub) {
      throw new ForbiddenException('Authentication required');
    }

    const actorUserId = currentUser.sub; // Use user ID from JWT
    let resourceUserId: string | null;

    const paramName = this.reflector.get<string>(
      'resourceParamName',
      context.getHandler()
    );

    try {
      if (!paramName) {
        throw new Error(
          'Resource parameter name not provided to ResourceOwnerGuard'
        );
      }

      const resourceId = params[paramName];

      if (!resourceId) {
        throw new ForbiddenException(
          `Resource ID not found in request parameters: ${paramName}`
        );
      }

      if (paramName === 'id') {
        // Check what controller we're in
        const controllerName = context.getClass().name;

        if (controllerName === 'SocialAccountController') {
          // For social account resources
          const socialAccount =
            await this.socialAccountService.findOne(resourceId);
          if (!socialAccount) {
            throw new NotFoundException('Social account not found');
          }
          resourceUserId = socialAccount.userId;
        } else {
          // For user resources, the resource ID is the user ID
          const resourceUser = await this.userService.getUserById(resourceId);
          if (!resourceUser) {
            throw new NotFoundException('User not found');
          }
          resourceUserId = resourceUser.supabaseId;
        }
      } else if (paramName === 'email') {
        const resourceUser = await this.userService.getUserByEmail(resourceId);
        if (!resourceUser) {
          throw new NotFoundException('User not found');
        }
        resourceUserId = resourceUser.supabaseId;
      } else if (paramName === 'socialAccountId') {
        // For social account resources
        const socialAccount =
          await this.socialAccountService.findOne(resourceId);
        if (!socialAccount) {
          throw new NotFoundException('Social account not found');
        }
        resourceUserId = socialAccount.userId;
      } else {
        throw new ForbiddenException('Unsupported resource parameter name');
      }

      // Check if the actor owns the resource
      console.log(
        `[ResourceOwnerGuard] Actor ID: ${actorUserId}, Resource User ID: ${resourceUserId}`
      );
      if (actorUserId !== resourceUserId) {
        throw new ForbiddenException('You can only access your own resources');
      }

      return true;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      console.error('ResourceOwnerGuard - Unexpected error caught:', error);
      throw new ForbiddenException('Access denied');
    }
  }
}
