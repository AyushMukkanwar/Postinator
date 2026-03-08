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
      useFactory: async (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';
        const host = configService.get<string>('REDIS_HOST');
        const port = configService.get<number>('REDIS_PORT');
        const password = configService.get<string>('REDIS_PASSWORD');

        if (isProduction && password) {
          // Use explicit config object with tls options for Upstash SNI
          const { Redis } = require('ioredis');
          return {
            connection: new Redis({
              host,
              port,
              password,
              tls: {
                servername: host,
              },
              maxRetriesPerRequest: null,
              keepAlive: 10000,
            }),
          };
        }

        return {
          connection: {
            host,
            port,
            password,
            maxRetriesPerRequest: null,
          },
        };
      },
      inject: [ConfigService],
    }),
    PrismaModule,
    PosterModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
