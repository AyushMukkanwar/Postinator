import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SUBSCRIPTION_PLANS, SubscriptionTier } from '@repo/database';
import * as crypto from 'crypto';
import RazorPay from 'razorpay';
import { Orders } from 'razorpay/dist/types/orders';
import { UserRepository } from 'src/database/repositories/user.repository';

@Injectable()
export class PaymentService {
  private razorPay: RazorPay;

  constructor(
    private config: ConfigService,
    private userRepo: UserRepository
  ) {
    this.razorPay = new RazorPay({
      key_id: this.config.getOrThrow('RAZORPAY_KEY_ID'),
      key_secret: this.config.getOrThrow('RAZORPAY_KEY_SECRET'),
    });
  }

  async createOrder(userId: string) {
    const amountInPaise = SUBSCRIPTION_PLANS[SubscriptionTier.PRO].price;

    const options: Orders.RazorpayOrderCreateRequestBody = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}_${userId.slice(-8)}`,
    };

    try {
      const order = await this.razorPay.orders.create(options);
      return order;
    } catch (error) {
      console.error('Razorpay Create Order Error:', error);
      throw new BadRequestException('Could not create Razorpay order');
    }
  }

  async verifyPayment(
    userId: string,
    body: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }
  ) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    const secret = this.config.getOrThrow('RAZORPAY_KEY_SECRET');

    const hmac = crypto.createHmac('sha256', secret);

    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature === razorpay_signature) {
      // Payment Successful! Update User
      await this.userRepo.update(userId, {
        subscriptionTier: SubscriptionTier.PRO,
      });
      return { success: true, message: 'Upgraded to PRO!' };
    } else {
      console.log('--- SIGNATURE VERIFICATION FAILED ---');
      console.log('Received:', {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });
      console.log('Generated:', generated_signature);
      console.log('Using Secret:', secret.slice(0, 5) + '...');
      throw new BadRequestException('Invalid Payment Signature');
    }
  }
}
