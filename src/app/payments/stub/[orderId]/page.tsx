import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { formatTenge } from '@/lib/utils';
import { ApproveStubButton } from './ApproveStubButton';

export default async function StubCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { orderId } = await params;
  const { ref } = await searchParams;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { program: true, user: true },
  });
  if (!order || !ref) notFound();

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 text-center space-y-4">
          <div className="text-sm text-muted-foreground uppercase tracking-wider">stub payment</div>
          <h1 className="text-2xl font-semibold">{order.program.nameRu}</h1>
          <p className="text-3xl font-bold tabular-nums">{formatTenge(order.amountTenge)}</p>
          <p className="text-sm text-muted-foreground">{order.user.email}</p>
          <div className="pt-2">
            <ApproveStubButton orderId={order.id} providerRef={ref} />
          </div>
          <p className="text-xs text-muted-foreground pt-4">
            Это эмулятор оплаты. В продакшене будет редирект на Kaspi/APIpay.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
