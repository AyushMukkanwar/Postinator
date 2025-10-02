import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { Request } from 'express';

export interface JwtPayload {
  supabaseId: string;
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

const fromCookie = (req: Request) => {
  console.log('--- Inside fromCookie extractor ---');
  let token = null;
  if (req && req.cookies) {
    console.log('Cookies found on request:', req.cookies);
    token = req.cookies['access_token'];
    if (token) {
      console.log('access_token found in cookie:', token);
    } else {
      console.log('access_token not found in cookie.');
    }
  } else {
    console.log('No cookies found on request.');
  }
  return token;
};

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy) {
  public constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        fromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
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
