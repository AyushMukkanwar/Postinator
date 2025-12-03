import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class DebugJwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(DebugJwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (info) {
      this.logger.error(`JWT Validation Failed: ${info.message}`);
      if (info instanceof Error) {
        this.logger.error(info.stack);
      }
    }
    if (err) {
      this.logger.error(`Auth Error: ${err.message}`, err.stack);
    }
    if (user) {
      this.logger.log(`User Authenticated: ${user.id}`);
    }

    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
