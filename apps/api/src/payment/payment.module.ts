import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UserModule } from '../user/user.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [UserModule, DatabaseModule], // Import DatabaseModule for UserRepository
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
