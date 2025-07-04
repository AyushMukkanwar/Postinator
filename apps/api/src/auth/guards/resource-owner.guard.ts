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
    const { params, user: currentUser } = request;

    if (!currentUser || !currentUser.email) {
      throw new ForbiddenException('Authentication required');
    }

    const actorEmail = currentUser.email; // Email of the user making the request (from JWT)
    let resourceEmail: string | undefined;

    try {
      // Case 1: The resource is identified by its email in the URL
      if (params.email) {
        resourceEmail = params.email;
      }
      // Case 2: The resource is identified by its ID in the URL
      else if (params.id) {
        const resourceUser = await this.userService.getUserById(params.id);
        if (!resourceUser) {
          throw new NotFoundException('Resource user not found');
        }
        resourceEmail = resourceUser.email;
      } else {
        // If no ID or email is in the params, the guard can't make a decision.
        // This might be an error or a route that doesn't need this guard.
        throw new ForbiddenException('Cannot determine resource ownership');
      }

      // The final, single check: Does the actor's email match the resource's email?
      if (actorEmail !== resourceEmail) {
        throw new ForbiddenException('You can only access your own resources');
      }

      return true;
    } catch (error) {
      // Re-throw known exceptions, otherwise deny access
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
