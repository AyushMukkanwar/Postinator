import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from 'src/user/user.service';

interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
  };
}

@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  constructor(private userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: AuthenticatedRequest = context.switchToHttp().getRequest();
    const resourceId = request.params.id; // The user ID from the URL
    const currentUser = request.user; // Set by your JWT auth guard (contains JWT payload)

    if (!currentUser || !currentUser.email) {
      throw new ForbiddenException('Authentication required');
    }

    try {
      // Find the current user in your database using their email from JWT
      const user = await this.userService.getUserByEmail(currentUser.email);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if the authenticated user is trying to access their own resource
      if (user.id !== resourceId) {
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
      throw new ForbiddenException('Access denied');
    }
  }
}
