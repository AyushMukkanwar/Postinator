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
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    forwardRef(() => UserModule),
    DatabaseModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get<string>('SUPABASE_JWT_SECRET'),
          signOptions: { expiresIn: '40000s' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: 'SUPABASE_CLIENT',
      useFactory: (configService: ConfigService) => {
        return createClient(
          configService.get<string>('SUPABASE_URL')!,
          configService.get<string>('SUPABASE_ANON_KEY')!
        );
      },
      inject: [ConfigService],
    },
    SupabaseStrategy,
    JwtAuthGuard,
    ResourceOwnerGuard,
    PrismaService,
    AuthService,
    UserService,
  ],
  exports: [JwtAuthGuard, JwtModule, ResourceOwnerGuard],
  controllers: [AuthController],
})
export class AuthModule {}
