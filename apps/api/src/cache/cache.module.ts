import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const store = await redisStore({
          socket: {
            host: configService.get<string>('REDIS_HOST'),
            port: configService.get<number>('REDIS_PORT'),
            tls:
              configService.get<string>('NODE_ENV') === 'production'
                ? {}
                : undefined,
          },
          password: configService.get<string>('REDIS_PASSWORD'),
        });
        return {
          store: store,
        };
      },
    }),
  ],
  exports: [CacheModule],
})
export class AppCacheModule {}
