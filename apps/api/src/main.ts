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
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://app.localhost:3000',
      'http://localhost:3001',
      'https://app.localhost:3001',
    ],
    credentials: true,
  });
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3001; // Default to 3001 if not in .env

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
