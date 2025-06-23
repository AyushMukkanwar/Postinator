// apps/api/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './guards/jwt.auth.guard'; // Corrected path
import { SupabaseStrategy } from './strategies/supabase.strategy';

@Module({
  imports: [
    PassportModule,
    ConfigModule, // Ensure ConfigModule is globally available or imported where needed
    JwtModule.registerAsync({
      imports: [ConfigModule], // Make ConfigService available
      useFactory: (configService: ConfigService) => {
        return {
          // global: true, // Setting global here makes this JWT module instance global
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: { expiresIn: '40000s' }, // Original was 40000 (number)
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [SupabaseStrategy, JwtAuthGuard], // Swapped order for convention, strategy first
  exports: [JwtAuthGuard, JwtModule], // Export SupabaseStrategy if needed elsewhere
})
export class AuthModule {}
