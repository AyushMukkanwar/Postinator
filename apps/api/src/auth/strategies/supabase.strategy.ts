// apps/api/src/auth/strategies/supabase.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy) {
  public constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('SUPABASE_JWT_SECRET'), // Make sure SUPABASE_JWT_SECRET is in your .env
    });
  }

  async validate(payload: any): Promise<any> {
    // You can add more validation logic here if needed
    // For example, check if user exists in your DB, or if the token is revoked
    return payload;
  }
}
