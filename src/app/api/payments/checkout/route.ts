import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPaymentProvider } from '@/lib/payments';

const Schema = z.object({ programId: z.string() });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const program = await prisma.program.findUnique({ where: { id: parsed.data.programId } });
  if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 404 });

  const provider = getPaymentProvider();
  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      programId: program.id,
      amountTenge: program.priceTenge,
      providerName: provider.name,
      status: 'PENDING',
    },
  });

  const baseUrl = process.env.PUBLIC_BASE_URL ?? '';
  const checkout = await provider.createCheckout(order, `${baseUrl}/ru/dashboard`);

  await prisma.order.update({ where: { id: order.id }, data: { providerRef: checkout.providerRef } });

  return NextResponse.json({ orderId: order.id, redirectUrl: checkout.redirectUrl });
}
