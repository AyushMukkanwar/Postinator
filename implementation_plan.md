# Authentication Refactor & OAuth Fix Plan

## Goal Description

Simplify the authentication flow by removing the custom JWT exchange and directly verifying Supabase JWTs in the NestJS backend. Also, fix the Twitter OAuth redirect URL to point to the frontend, hiding the backend API URL.

## User Review Required

> [!IMPORTANT]
> This is a breaking change for the authentication flow. The `access_token` cookie will no longer be used. The frontend will need to pass the Supabase session token in the `Authorization` header.

## Proposed Changes

### Database Schema

#### [MODIFY] [schema.prisma](file:///home/ayush_mukkanwar/Dev/Projects/uploader/apps/api/prisma/schema.prisma)

- Add `Role` enum: `USER`, `ADMIN`.
- Add `role` field to `User` model (default: `USER`).

### Backend (NestJS API)

#### [MODIFY] [auth.module.ts](file:///home/ayush_mukkanwar/Dev/Projects/uploader/apps/api/src/auth/auth.module.ts)

- Register `SupabaseStrategy` (using `passport-jwt`).
- Remove `AuthController` (no longer needed for exchange).

#### [NEW] [supabase.strategy.ts](file:///home/ayush_mukkanwar/Dev/Projects/uploader/apps/api/src/auth/strategies/supabase.strategy.ts)

- Implement `PassportStrategy(Strategy)` to verify the Supabase JWT.
- Extract `sub` (user ID) from the token.

#### [NEW] [roles.decorator.ts](file:///home/ayush_mukkanwar/Dev/Projects/uploader/apps/api/src/auth/decorators/roles.decorator.ts)

- Create `@Roles(...)` decorator to specify required roles for a route.

#### [NEW] [roles.guard.ts](file:///home/ayush_mukkanwar/Dev/Projects/uploader/apps/api/src/auth/guards/roles.guard.ts)

- Implement `RolesGuard` to check if the user has the required role.
- Should run _after_ `JwtAuthGuard`.

#### [MODIFY] [jwt.auth.guard.ts](file:///home/ayush_mukkanwar/Dev/Projects/uploader/apps/api/src/auth/guards/jwt.auth.guard.ts)

- Update to use the 'jwt' strategy (which will now be the Supabase strategy).
- **Optimization**: Implement a caching mechanism (Redis) to fetch user details (like `role`, `plan`) using the `sub` from the token, to avoid hitting the DB on every request.

#### [MODIFY] [resource-owner.guard.ts](file:///home/ayush_mukkanwar/Dev/Projects/uploader/apps/api/src/auth/guards/resource-owner.guard.ts)

- **No changes needed** for the logic itself, as it checks ownership based on `userId`.
- However, we should ensure it works seamlessly with the new `SupabaseStrategy` user object.

#### [DELETE] [auth.controller.ts](file:///home/ayush_mukkanwar/Dev/Projects/uploader/apps/api/src/auth/auth.controller.ts)

- Remove the `exchange-token` endpoint.

### Frontend (Next.js)

#### [MODIFY] [auth-fetch.ts](file:///home/ayush_mukkanwar/Dev/Projects/uploader/apps/web/lib/auth/auth-fetch.ts)

- Remove `exchangeTokenForCustomJwt`, `getCustomJwt`, `clearCustomJwt`.
- Update `authenticatedFetch` to get the session from `supabase.auth.getSession()` and use `session.access_token`.

### OAuth Configuration

#### [MODIFY] [.env](file:///home/ayush_mukkanwar/Dev/Projects/uploader/apps/api/.env)

- Update `TWITTER_REDIRECT_URI` to point to the frontend URL (e.g., `http://localhost:3000/twitter/callback`).

## Verification Plan

### Automated Tests

- Run existing tests to ensure no regression (though auth tests will need updating).

### Manual Verification

1.  **Login**: Log in with Supabase and verify the dashboard loads.
2.  **API Calls**: Check Network tab to ensure requests to backend include the Supabase token.
3.  **Twitter Connect**:
    - Click "Connect Twitter".
    - Verify redirect goes to Twitter.
    - Verify callback goes to `http://localhost:3000/twitter/callback`.
    - Verify account is connected successfully.
