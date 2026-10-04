// ============================================
// NIVA — Payments & Autonomous Commerce Types
// ============================================

export type PaymentProvider = 'razorpay' | 'stripe' | 'upi_simulator';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface SubscriptionPlan {
  id: string;
  name: string;
  badge: string;
  priceINR: number;
  priceUSD: number;
  interval: 'monthly' | 'yearly';
  description: string;
  features: string[];
  isPopular?: boolean;
}

export interface PaymentOrder {
  id: string;
  userId: string;
  planId: string;
  amount: number;
  currency: 'INR' | 'USD';
  status: PaymentStatus;
  provider: PaymentProvider;
  createdAt: string;
  receiptNumber: string;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  userId: string;
  paymentId: string;
  signature: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  verifiedAt: string;
  planName: string;
}

export interface VerifyPaymentDTO {
  orderId: string;
  paymentId: string;
  signature: string;
  planId: string;
}
