import type { Order } from '@prisma/client';
import type { CheckoutResult, PaymentProvider, WebhookEvent } from './index';

/**
 * Skeleton for Kaspi.kz / APIpay integration.
 * Fill in real HTTP calls + signature verification when credentials are available.
 */
export class KaspiProvider implements PaymentProvider {
  name = 'kaspi';

  async createCheckout(_order: Order, _returnUrl: string): Promise<CheckoutResult> {
    throw new Error('KaspiProvider.createCheckout: not implemented. Provide APIpay credentials and complete this method.');
  }

  async parseWebhook(_req: Request): Promise<WebhookEvent> {
    throw new Error('KaspiProvider.parseWebhook: not implemented. Implement signature verification and payload parsing.');
  }
}
