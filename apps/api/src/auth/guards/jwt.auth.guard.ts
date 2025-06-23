// apps/api/src/auth/guards/jwt.auth.guard.ts
import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common'; // Ensure Injectable is imported if needed, though AuthGuard('jwt') usually suffices.

@Injectable() // Good practice to add Injectable if it might have dependencies later
export class JwtAuthGuard extends AuthGuard('jwt') {}
