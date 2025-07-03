import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch() // Catch all exceptions for debugging
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Check if it's a Prisma error
    if (exception.code === 'P2002') {
      return response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message: 'Duplicate record',
        error: 'Conflict',
      });
    }

    if (exception.code === 'P2025') {
      return response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Record not found',
        error: 'Not Found',
      });
    }

    // Handle NestJS built-in exceptions (NotFoundException, UnauthorizedException, etc.)
    if (exception.getStatus && typeof exception.getStatus === 'function') {
      const status = exception.getStatus();
      return response.status(status).json({
        statusCode: status,
        message: exception.message,
        error: exception.constructor.name.replace('Exception', ''),
      });
    }

    // Default to 500
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
  }
}

// Register in main.ts:
// app.useGlobalFilters(new PrismaExceptionFilter());