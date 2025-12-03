import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { createClient } from '@supabase/supabase-js';
import { JwtAuthGuard } from './guards/jwt.auth.guard';
import { SupabaseStrategy } from './strategies/supabase.strategy';
import { UserModule } from 'src/user/user.module';
import { ResourceOwnerGuard } from './guards/resource-owner.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { DatabaseModule } from 'src/database/database.module';
import { AppCacheModule } from 'src/cache/cache.module';
import { SocialAccountModule } from 'src/social-account/social-account.module';
import { TwitterModule } from 'src/twitter/twitter.module';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    forwardRef(() => UserModule),
    DatabaseModule,
    AppCacheModule,
    SocialAccountModule,
    TwitterModule,
  ],
  providers: [
    {
      provide: 'SUPABASE_CLIENT',
      useFactory: (configService: ConfigService) => {
        const supabaseUrl = configService.get<string>('SUPABASE_URL');
        if (!supabaseUrl) {
          throw new Error(
            'SUPABASE_URL is not defined in environment variables.'
          );
        }

        const supabaseSecretKey = configService.get<string>(
          'SUPABASE_SECRET_KEY'
        );
        if (!supabaseSecretKey) {
          throw new Error(
            'SUPABASE_SECRET_KEY is not defined in environment variables.'
          );
        }

        return createClient(supabaseUrl, supabaseSecretKey);
      },
      inject: [ConfigService],
    },
    SupabaseStrategy,
    JwtAuthGuard,
    ResourceOwnerGuard,
    RolesGuard,
    PrismaService,
    UserService,
  ],
  exports: [JwtAuthGuard, ResourceOwnerGuard, RolesGuard],
  controllers: [],
})
export class AuthModule {}
