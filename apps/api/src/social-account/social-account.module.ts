import { Module, forwardRef } from '@nestjs/common';
import { SocialAccountService } from './social-account.service';
import { SocialAccountController } from './social-account.controller';
import { DatabaseModule } from '../database/database.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => UserModule)],
  controllers: [SocialAccountController],
  providers: [SocialAccountService],
  exports: [SocialAccountService],
})
export class SocialAccountModule {}
