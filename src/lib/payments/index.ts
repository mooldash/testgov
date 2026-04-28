import type { Order } from '@prisma/client';

export interface CheckoutResult {
  redirectUrl: string;
  providerRef: string;
}

export interface WebhookEvent {
  providerRef: string;
  status: 'PAID' | 'FAILED';
  rawAmount?: number;
}

export interface PaymentProvider {
  name: string;
  createCheckout(order: Order, returnUrl: string): Promise<CheckoutResult>;
  parseWebhook(req: Request): Promise<WebhookEvent>;
}

import { StubProvider } from './stub';
import { KaspiProvider } from './kaspi';

let _provider: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (_provider) return _provider;
  const which = process.env.PAYMENT_PROVIDER ?? 'stub';
  switch (which) {
    case 'stub':
      _provider = new StubProvider();
      break;
    case 'kaspi':
      _provider = new KaspiProvider();
      break;
    default:
      throw new Error(`Unknown PAYMENT_PROVIDER: ${which}`);
  }
  return _provider;
}
