import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserService } from '../user/user.service'; // Adjust path as needed
import { Prisma } from 'generated/prisma';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

export interface EnhancedTokenResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @Inject('SUPABASE_CLIENT') private supabase: SupabaseClient,
    private jwtService: JwtService,
    private userService: UserService,
    private configService: ConfigService
  ) {}

  async exchangeSupabaseToken(
    supabaseToken: string
  ): Promise<EnhancedTokenResponse> {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser(supabaseToken);

      if (error || !user) {
        throw new UnauthorizedException('Invalid Supabase token');
      }

      // 2.1 Find User
      let dbUser = await this.userService.getUserByEmail(user.email as string);

      //   2.2 If not User create one
      if (!dbUser) {
        const createUserInput: Prisma.UserCreateInput = {
          email: user.email as string,
          supabaseId: user.id as string,
          name: user.user_metadata.full_name,
          avatar: user.user_metadata.avatar_url,
        };
        dbUser = await this.userService.createUser(createUserInput);
      }

      // 3. Create enhanced JWT with your database user info
      const enhancedPayload = {
        supabaseId: user.id as string,
        userId: dbUser.id,
        email: dbUser.email,
        // Add other fields you need (role, etc.)
        iat: Math.floor(Date.now() / 1000),
      };

      const enhancedJWT = this.jwtService.sign(enhancedPayload, {
        expiresIn: '1h',
      });

      return {
        token: enhancedJWT,
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          avatar: dbUser.avatar,
          // Return other safe user data
        },
      };
    } catch (error) {
      console.error('Token exchange error during verification:', error);
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid Supabase token');
      }
      throw new UnauthorizedException('Token exchange failed');
    }
  }

  async refreshToken(refreshToken: string): Promise<EnhancedTokenResponse> {
    try {
      // Refresh Supabase session
      const { data, error } = await this.supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Exchange new access token for enhanced JWT
      return this.exchangeSupabaseToken(data.session.access_token);
    } catch (error) {
      console.error('Token refresh error:', error);
      throw new UnauthorizedException('Token refresh failed');
    }
  }
}
