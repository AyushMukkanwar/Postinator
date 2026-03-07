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
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';
        const host = configService.get<string>('REDIS_HOST');
        const port = configService.get<number>('REDIS_PORT') || 6379;
        const password = configService.get<string>('REDIS_PASSWORD');

        // In production, use rediss:// (TLS) URL for Upstash compatibility.
        // In development, use plain socket connection for local Redis.
        let store;
        if (isProduction && password) {
          store = await redisStore({
            url: `rediss://default:${password}@${host}:${port}`,
          });
        } else {
          store = await redisStore({
            socket: { host, port },
            password,
          });
        }
        return { store };
      },
    }),
  ],
  exports: [CacheModule],
})
export class AppCacheModule {}
