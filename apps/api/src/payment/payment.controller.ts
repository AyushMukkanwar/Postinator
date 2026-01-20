import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt.auth.guard';
import {
  CreateOrderResponseDto,
  VerifyPaymentResponseDto,
} from './dto/response.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { PaymentService } from './payment.service';

@Controller('payment')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('create-order')
  async createOrder(@Request() req): Promise<CreateOrderResponseDto> {
    return this.paymentService.createOrder(req.user.id);
  }

  @Post('verify')
  async verifyPayment(
    @Request() req,
    @Body() body: VerifyPaymentDto
  ): Promise<VerifyPaymentResponseDto> {
    return this.paymentService.verifyPayment(req.user.id, body);
  }
}
