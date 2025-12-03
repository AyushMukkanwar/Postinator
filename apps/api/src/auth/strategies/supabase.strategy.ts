import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { UserService } from 'src/user/user.service';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly userService: UserService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('SUPABASE_JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const supabaseId = payload.sub;
    if (!supabaseId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const cacheKey = `user:${supabaseId}`;
    const cachedUser = await this.cacheManager.get(cacheKey);

    if (cachedUser) {
      return cachedUser;
    }

    // Fetch user from DB
    // We assume the user exists in our DB if they have a valid Supabase token.
    // If not, we might need to create them (sync) or throw error.
    // For now, let's try to find them.
    let user = await this.userService.findBySupabaseId(supabaseId);

    if (!user) {
      // If not found by Supabase ID, try to find by email to link accounts
      const email = payload.email;
      if (email) {
        user = await this.userService.getUserByEmail(email);
        if (user) {
          // Link the existing user to this Supabase ID
          user = await this.userService.updateUser(user.id, { supabaseId });
        }
      }

      // If still not found, create a new user
      if (!user) {
        if (!email) {
          throw new UnauthorizedException('Email is required to create a user');
        }

        try {
          user = await this.userService.createUser({
            supabaseId,
            email,
            name:
              payload.user_metadata?.full_name ||
              payload.user_metadata?.name ||
              email.split('@')[0],
            avatar: payload.user_metadata?.avatar_url,
          });
        } catch (error) {
          console.error('SupabaseStrategy: Error creating user:', error);
          throw new UnauthorizedException('Failed to create user');
        }
      }
    }

    await this.cacheManager.set(cacheKey, user, 60000); // Cache for 1 minute
    return user;
  }
}
