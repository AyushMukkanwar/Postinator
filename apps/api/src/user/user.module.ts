// src/user/user.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaModule } from '../prisma/prisma.module';
import { DatabaseModule } from 'src/database/database.module';
import { UserController } from './user.controller';
import { SocialAccountModule } from 'src/social-account/social-account.module';

@Module({
  imports: [
    PrismaModule,
    DatabaseModule,
    forwardRef(() => SocialAccountModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
