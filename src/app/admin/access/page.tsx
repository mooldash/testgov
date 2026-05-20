import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, formatDateTime, formatTenge } from '@/lib/utils';
import { GrantAccessDialog } from './GrantAccessDialog';
import { ExtendAccessButton, type ExtendTariff } from './ExtendAccessButton';
import { RevokeAccessButton } from './RevokeAccessButton';
import { UserInfoButton } from './UserInfoButton';
import { AccessFilters } from './AccessFilters';

const SOURCE_LABEL = {
  MANUAL: { label: 'Вручную', variant: 'secondary' as const },
  PURCHASE: { label: 'Оплачен', variant: 'success' as const },
};

function daysRemaining(expiresAt: Date): number {
  return Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function AdminAccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    program?: string;
    status?: string;
    source?: string;
    paid?: string;
    created?: string;
  }>;
}) {
  const sp = await searchParams;
  const now = new Date();

  // Build Prisma where clause from filters
  const where: Prisma.UserAccessWhereInput = {};

  if (sp.q && sp.q.trim()) {
    const q = sp.q.trim();
    where.OR = [
      { user: { email: { contains: q, mode: 'insensitive' } } },
      { user: { name: { contains: q, mode: 'insensitive' } } },
      { program: { nameRu: { contains: q, mode: 'insensitive' } } },
      { program: { nameKk: { contains: q, mode: 'insensitive' } } },
      { tariff: { nameRu: { contains: q, mode: 'insensitive' } } },
      { tariff: { nameKk: { contains: q, mode: 'insensitive' } } },
    ];
  }
  if (sp.program) where.programId = sp.program;
  if (sp.source === 'PURCHASE' || sp.source === 'MANUAL') where.source = sp.source;
  if (sp.status === 'active') where.expiresAt = { gt: addDays(now, 7) };
  else if (sp.status === 'soon7') where.expiresAt = { gt: now, lte: addDays(now, 7) };
  else if (sp.status === 'soon30') where.expiresAt = { gt: now, lte: addDays(now, 30) };
  else if (sp.status === 'expired') where.expiresAt = { lt: now };
  if (sp.paid === 'free') where.paidAmountTenge = 0;
  else if (sp.paid === 'paid') where.paidAmountTenge = { gt: 0 };
  if (sp.created === 'today') where.createdAt = { gte: startOfToday() };
  else if (sp.created === '7d') where.createdAt = { gte: addDays(now, -7) };
  else if (sp.created === '30d') where.createdAt = { gte: addDays(now, -30) };

  const [accesses, totalCount, programs, tariffs, users] = await Promise.all([
    prisma.userAccess.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, name: true } },
        program: { select: { id: true, nameRu: true, slug: true } },
        tariff: { select: { id: true, nameRu: true, key: true } },
      },
      take: 200,
    }),
    prisma.userAccess.count(),
    prisma.program.findMany({ orderBy: { order: 'asc' }, select: { id: true, nameRu: true } }),
    prisma.tariff.findMany({
      where: { isPublished: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        programId: true,
        nameRu: true,
        durationDays: true,
        priceTenge: true,
        recommended: true,
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, name: true },
      take: 500,
    }),
  ]);

  const totalActive = accesses.filter((a) => a.expiresAt > now).length;
  const totalPaid = accesses.reduce((sum, a) => sum + a.paidAmountTenge, 0);

  const tariffsByProgram = new Map<string, ExtendTariff[]>();
  for (const t of tariffs) {
    const arr = tariffsByProgram.get(t.programId) ?? [];
    arr.push({
      id: t.id,
      nameRu: t.nameRu,
      durationDays: t.durationDays,
      priceTenge: t.priceTenge,
    });
    tariffsByProgram.set(t.programId, arr);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Доступы</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Всего {totalCount} · в выборке активных {totalActive} · оплачено в выборке {formatTenge(totalPaid)}
          </p>
        </div>
        <GrantAccessDialog users={users} programs={programs} tariffs={tariffs} />
      </div>

      <AccessFilters programs={programs} total={totalCount} filtered={accesses.length} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>Пользователь</TableHead>
            <TableHead>Программа</TableHead>
            <TableHead className="w-32">Тариф</TableHead>
            <TableHead className="w-44">Срок</TableHead>
            <TableHead className="w-28 text-right">Оплачено</TableHead>
            <TableHead className="w-28">Источник</TableHead>
            <TableHead className="w-28">Статус</TableHead>
            <TableHead className="w-32">Создан</TableHead>
            <TableHead className="w-32 text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accesses.length === 0 && (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                Ничего не найдено по выбранным фильтрам.
              </TableCell>
            </TableRow>
          )}
          {accesses.map((a, idx) => {
            const remaining = daysRemaining(a.expiresAt);
            const active = remaining > 0;
            const src = SOURCE_LABEL[a.source];
            const programTariffs = tariffsByProgram.get(a.programId) ?? [];
            return (
              <TableRow key={a.id} className="text-sm">
                <TableCell className="py-2 text-muted-foreground tabular-nums">{idx + 1}</TableCell>
                <TableCell className="py-2">
                  <div className="font-medium leading-tight">{a.user.email}</div>
                  {a.user.name && (
                    <div className="text-xs text-muted-foreground">{a.user.name}</div>
                  )}
                </TableCell>
                <TableCell className="py-2">{a.program.nameRu}</TableCell>
                <TableCell className="py-2">
                  {a.tariff ? (
                    <Badge variant="outline" className="font-normal">{a.tariff.nameRu}</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="py-2">
                  <div className="text-xs text-muted-foreground">{formatDate(a.expiresAt, 'ru')}</div>
                  <div
                    className={
                      active
                        ? remaining <= 3
                          ? 'text-xs font-medium text-amber-600'
                          : 'text-xs font-medium text-emerald-700 dark:text-emerald-400'
                        : 'text-xs font-medium text-destructive'
                    }
                  >
                    {active ? `осталось ${remaining} дн.` : `истёк ${-remaining} дн. назад`}
                  </div>
                </TableCell>
                <TableCell className="py-2 text-right tabular-nums">
                  {a.paidAmountTenge > 0 ? (
                    formatTenge(a.paidAmountTenge)
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="py-2">
                  <Badge variant={src.variant}>{src.label}</Badge>
                </TableCell>
                <TableCell className="py-2">
                  {active ? (
                    <Badge variant="success">Активен</Badge>
                  ) : (
                    <Badge variant="secondary">Истёк</Badge>
                  )}
                </TableCell>
                <TableCell className="py-2 text-xs text-muted-foreground">
                  {formatDateTime(a.createdAt, 'ru')}
                </TableCell>
                <TableCell className="py-2 text-right">
                  <div className="flex justify-end gap-1">
                    <UserInfoButton userId={a.user.id} />
                    <ExtendAccessButton accessId={a.id} tariffs={programTariffs} />
                    <RevokeAccessButton
                      accessId={a.id}
                      userEmail={a.user.email}
                      programName={a.program.nameRu}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
