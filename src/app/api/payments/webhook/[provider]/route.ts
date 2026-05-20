import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPaymentProvider } from '@/lib/payments';

export async function POST(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider: name } = await ctx.params;
  const provider = getPaymentProvider();
  if (provider.name !== name) {
    return NextResponse.json({ error: 'Provider mismatch' }, { status: 400 });
  }

  const event = await provider.parseWebhook(req).catch(() => null);
  if (!event) return NextResponse.json({ error: 'Bad event' }, { status: 400 });

  const order = await prisma.order.findFirst({ where: { providerRef: event.providerRef } });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.status !== 'PENDING') {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  if (event.status !== 'PAID') {
    await prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } });
    return NextResponse.json({ ok: true });
  }

  // Grant access — prefer the duration stored on the order (tariff-aware),
  // fall back to the program's default duration.
  const program = await prisma.program.findUnique({ where: { id: order.programId } });
  if (!program) return NextResponse.json({ error: 'Program missing' }, { status: 500 });

  const days = order.durationDays ?? program.durationDays;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  // Resolve tariff (if order references one) so UserAccess keeps the link
  let tariffId: string | null = null;
  if (order.tariffKey) {
    const tariff = await prisma.tariff.findUnique({
      where: { programId_key: { programId: order.programId, key: order.tariffKey } },
    });
    if (tariff) tariffId = tariff.id;
  }

  await prisma.$transaction([
    prisma.order.update({ where: { id: order.id }, data: { status: 'PAID' } }),
    prisma.userAccess.create({
      data: {
        userId: order.userId,
        programId: order.programId,
        tariffId,
        expiresAt,
        source: 'PURCHASE',
        paidAmountTenge: order.amountTenge,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
