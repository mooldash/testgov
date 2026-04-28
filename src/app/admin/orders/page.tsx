import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { formatDateTime, formatTenge } from '@/lib/utils';

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: true, program: true },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Заказы</h1>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="p-3 font-medium">Дата</th>
              <th className="p-3 font-medium">Пользователь</th>
              <th className="p-3 font-medium">Программа</th>
              <th className="p-3 font-medium">Сумма</th>
              <th className="p-3 font-medium">Провайдер</th>
              <th className="p-3 font-medium">Статус</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Заказов пока нет</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-3 text-muted-foreground">{formatDateTime(o.createdAt, 'ru')}</td>
                <td className="p-3">{o.user.email}</td>
                <td className="p-3">{o.program.nameRu}</td>
                <td className="p-3 tabular-nums">{formatTenge(o.amountTenge)}</td>
                <td className="p-3">{o.providerName}</td>
                <td className="p-3"><StatusBadge status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'PAID') return <Badge variant="success">Оплачен</Badge>;
  if (status === 'PENDING') return <Badge variant="secondary">Ожидает</Badge>;
  if (status === 'REFUNDED') return <Badge variant="outline">Возврат</Badge>;
  return <Badge variant="destructive">Ошибка</Badge>;
}
