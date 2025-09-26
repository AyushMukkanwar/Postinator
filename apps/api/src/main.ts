// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { PrismaExceptionFilter } from './filters/prisma-exception.filter';

import { HttpExceptionFilter } from './filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
