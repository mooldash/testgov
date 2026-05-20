import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPaymentProvider } from '@/lib/payments';

const Schema = z.object({
  programId: z.string(),
  tariffId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const program = await prisma.program.findUnique({ where: { id: parsed.data.programId } });
  if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 404 });

  let amountTenge = program.priceTenge;
  let durationDays = program.durationDays;
  let tariffKey: string | null = null;

  if (parsed.data.tariffId) {
    const tariff = await prisma.tariff.findUnique({ where: { id: parsed.data.tariffId } });
    if (!tariff || tariff.programId !== program.id) {
      return NextResponse.json({ error: 'Invalid tariff' }, { status: 400 });
    }
    amountTenge = tariff.priceTenge;
    durationDays = tariff.durationDays;
    tariffKey = tariff.key;
  }

  const provider = getPaymentProvider();
  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      programId: program.id,
      amountTenge,
      durationDays,
      tariffKey,
      providerName: provider.name,
      status: 'PENDING',
    },
  });

  const baseUrl = process.env.PUBLIC_BASE_URL ?? '';
  const checkout = await provider.createCheckout(order, `${baseUrl}/ru/dashboard`);

  await prisma.order.update({ where: { id: order.id }, data: { providerRef: checkout.providerRef } });

  return NextResponse.json({ orderId: order.id, redirectUrl: checkout.redirectUrl });
}
