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

  // The authenticate method is part of the base PassportStrategy and usually doesn't need overriding
  // unless you have very specific custom logic for the authentication process itself.
  // The article includes `super.authenticate(req)`, which just calls the parent's authenticate.
  // If you don't have custom logic before or after calling super.authenticate, this override is often not needed.
  // For simplicity and adherence to the article:
  // authenticate(req) {
  //   super.authenticate(req);
  // }
}
