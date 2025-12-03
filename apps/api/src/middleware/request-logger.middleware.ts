import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Request');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, headers } = req;
    this.logger.log(`Incoming Request: ${method} ${originalUrl}`);
    if (headers.authorization) {
      this.logger.log(
        `Authorization Header: ${headers.authorization.substring(0, 20)}...`
      );
    } else {
      this.logger.warn('No Authorization Header present');
    }
    next();
  }
}
