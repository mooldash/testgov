import type { Order } from '@prisma/client';
import type { CheckoutResult, PaymentProvider, WebhookEvent } from './index';

export class StubProvider implements PaymentProvider {
  name = 'stub';

  async createCheckout(order: Order): Promise<CheckoutResult> {
    const ref = `stub_${order.id}_${Date.now()}`;
    const redirectUrl = `/payments/stub/${order.id}?ref=${encodeURIComponent(ref)}`;
    return { redirectUrl, providerRef: ref };
  }

  async parseWebhook(req: Request): Promise<WebhookEvent> {
    const body = await req.json();
    return {
      providerRef: String(body.providerRef ?? ''),
      status: body.status === 'PAID' ? 'PAID' : 'FAILED',
      rawAmount: body.amount ? Number(body.amount) : undefined,
    };
  }
}
