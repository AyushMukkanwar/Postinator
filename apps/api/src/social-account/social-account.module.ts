import { Module, forwardRef } from '@nestjs/common';
import { EncryptionModule } from 'src/encryption/encryption.module';
import { UserModule } from 'src/user/user.module';
import { DatabaseModule } from '../database/database.module';
import { LinkedinService } from '../linkedin/linkedin.service';
import { TwitterModule } from '../twitter/twitter.module';
import { SocialAccountController } from './social-account.controller';
import { SocialAccountService } from './social-account.service';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => UserModule),
    EncryptionModule,
    TwitterModule,
  ],
  controllers: [SocialAccountController],
  providers: [SocialAccountService, LinkedinService],
  exports: [SocialAccountService],
})
export class SocialAccountModule {}
