import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';

export interface JwtPayload {
  supabaseId: string;
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy) {
  public constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('SUPABASE_JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    try {
      const user = await this.userService.getUserById(payload.userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid token or user does not exist');
    }
  }
}
