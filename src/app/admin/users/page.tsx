import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { UserInfoButton } from '../access/UserInfoButton';
import { ResetPasswordButton } from '../access/ResetPasswordButton';

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { _count: { select: { attempts: true, access: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Пользователи ({users.length})</h1>
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
    </div>
  );
}
