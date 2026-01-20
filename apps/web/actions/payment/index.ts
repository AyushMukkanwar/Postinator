'use server';

import { VerifyPaymentDto } from '@/lib/api/model';
import {
  paymentControllerCreateOrder,
  paymentControllerVerifyPayment,
} from '@/lib/api/payment/payment';

export async function createRazorpayOrder() {
  try {
    const data = await paymentControllerCreateOrder();
    return { data };
  } catch (error) {
    console.error('Create order error:', error);
    return { error: 'Failed to create payment order' };
  }
}

export async function verifyRazorpayPayment(paymentData: VerifyPaymentDto) {
  try {
    const data = await paymentControllerVerifyPayment(paymentData);
    return { data };
  } catch (error) {
    console.error('Verify payment error:', error);
    return { error: 'Failed to verify payment' };
  }
}
