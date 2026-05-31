import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import { UserInfoButton } from '../access/UserInfoButton';
import { ResetPasswordButton } from '../access/ResetPasswordButton';

const PAGE_SIZE = 50;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      include: { _count: { select: { attempts: true, access: true } } },
    }),
    prisma.user.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const from = totalCount === 0 ? 0 : skip + 1;
  const to = skip + users.length;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Пользователи ({totalCount})</h1>
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Имя</th>
              <th className="p-3 font-medium">Роль</th>
              <th className="p-3 font-medium text-right">Доступы</th>
              <th className="p-3 font-medium text-right">Попытки</th>
              <th className="p-3 font-medium">Зарегистрирован</th>
              <th className="p-3 font-medium w-28 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.email}</td>
                <td className="p-3 text-muted-foreground">{u.name ?? '—'}</td>
                <td className="p-3">{u.role === 'ADMIN' ? <Badge>ADMIN</Badge> : <Badge variant="secondary">USER</Badge>}</td>
                <td className="p-3 tabular-nums text-right">{u._count.access}</td>
                <td className="p-3 tabular-nums text-right">{u._count.attempts}</td>
                <td className="p-3 text-muted-foreground">{formatDateTime(u.createdAt, 'ru')}</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <UserInfoButton userId={u.id} />
                    <ResetPasswordButton userId={u.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} from={from} to={to} total={totalCount} />
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  from,
  to,
  total,
}: {
  page: number;
  totalPages: number;
  from: number;
  to: number;
  total: number;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap text-sm">
      <span className="text-muted-foreground tabular-nums">
        {from}–{to} из {total}
      </span>
      <div className="flex gap-1">
        <Button asChild variant="outline" size="sm" disabled={page <= 1}>
          <Link
            href={page <= 1 ? '#' : `/admin/users?page=${page - 1}`}
            aria-disabled={page <= 1}
            tabIndex={page <= 1 ? -1 : 0}
            className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
          >
            ← Назад
          </Link>
        </Button>
        <span className="inline-flex items-center px-3 tabular-nums text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button asChild variant="outline" size="sm" disabled={page >= totalPages}>
          <Link
            href={page >= totalPages ? '#' : `/admin/users?page=${page + 1}`}
            aria-disabled={page >= totalPages}
            tabIndex={page >= totalPages ? -1 : 0}
            className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
          >
            Дальше →
          </Link>
        </Button>
      </div>
    </div>
  );
}
