export class CreateOrderResponseDto {
  id: string;
  entity: string;
  amount: number | string;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt?: string;
  status: string;
  attempts: number;
  notes?: any;
  created_at: number;
}

export class VerifyPaymentResponseDto {
  success: boolean;
  message: string;
}
