import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PosterModule } from './poster/poster.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          password: configService.get<string>('REDIS_PASSWORD'),
          tls:
            configService.get<string>('NODE_ENV') === 'production'
              ? {}
              : undefined,
          maxRetriesPerRequest: null,
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    PosterModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
