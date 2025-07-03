// src/user/user.module.ts
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaModule } from '../prisma/prisma.module';
import { DatabaseModule } from 'src/database/database.module';
import { UserController } from './user.controller';

@Module({
  imports: [PrismaModule, DatabaseModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
