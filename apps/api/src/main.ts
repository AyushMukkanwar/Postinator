// apps/api/src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './filters/prisma-exception.filter';

import { HttpExceptionFilter } from './filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3001; // Default to 3001 if not in .env

  // Build allowed CORS origins: always include localhost for local dev,
  // and add the production WEB_URL from environment variables if set.
  const webUrl = configService.get<string>('WEB_URL');
  const allowedOrigins = [
    'http://localhost:3000',
    'https://app.localhost:3000',
    'http://localhost:3001',
    'https://app.localhost:3001',
  ];
  if (webUrl) {
    allowedOrigins.push(webUrl);
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Automatically remove non-whitelisted properties
      transform: true, // Automatically transform payloads to DTO instances
    })
  );

  app.useGlobalFilters(new PrismaExceptionFilter(), new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Uploader Docs')
    .setDescription('documentation for api enpoints of the Uploader.')
    .setVersion('1.0')
    .addTag('your-tag') // optional
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  console.log(`API is running on: ${await app.getUrl()}`);
}
bootstrap();
