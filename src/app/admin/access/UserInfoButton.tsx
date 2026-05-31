'use client';

import { useEffect, useState } from 'react';
import {
  Info,
  Mail,
  Phone,
  User as UserIcon,
  Calendar,
  Shield,
  Languages,
  Loader2,
  KeyRound,
  History,
  CreditCard,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { getUserInfo, type UserInfo } from '@/app/admin/actions';
import { formatDateTime, formatTenge } from '@/lib/utils';
import { ResetPasswordButton } from './ResetPasswordButton';

export function UserInfoButton({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getUserInfo(userId)
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [open, userId]);

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setOpen(true)}
        title="Информация о пользователе"
      >
        <Info className="h-3.5 w-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Информация о пользователе</DialogTitle>
          </DialogHeader>

          {loading && !data ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !data ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Пользователь не найден
            </p>
          ) : (
            <div className="space-y-5">
              {/* Identity block */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium">{data.name || '—'}</span>
                  {data.role === 'ADMIN' && (
                    <Badge variant="secondary" className="ml-1">ADMIN</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-mono">{data.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-mono">{data.phone || '—'}</span>
                </div>
              </div>

              {/* Metadata block */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoRow
                  icon={<Calendar className="h-3.5 w-3.5" />}
                  label="Регистрация"
                  value={formatDateTime(data.createdAt, 'ru')}
                />
                <InfoRow
                  icon={<Languages className="h-3.5 w-3.5" />}
                  label="Язык"
                  value={data.localePref === 'KK' ? 'Қазақша' : 'Русский'}
                />
                <InfoRow
                  icon={<Shield className="h-3.5 w-3.5" />}
                  label="Роль"
                  value={data.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
                />
                <InfoRow
                  icon={<KeyRound className="h-3.5 w-3.5" />}
                  label="Активный доступ"
                  value={`${data.activeAccessCount} из ${data.totalAccessCount}`}
                />
              </div>

              {/* Stats block */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  icon={<History className="h-4 w-4" />}
                  value={data.attemptCount}
                  label="Попыток"
                />
                <StatCard
                  icon={<Trophy className="h-4 w-4" />}
                  value={data.passedCount}
                  label="Сдано"
                  highlight="emerald"
                />
                <StatCard
                  icon={<CreditCard className="h-4 w-4" />}
                  value={data.paidOrdersCount}
                  label="Оплат"
                />
                <StatCard
                  icon={<CreditCard className="h-4 w-4" />}
                  value={formatTenge(data.totalPaidTenge)}
                  label="Сумма"
                  small
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-2 gap-2 sm:gap-2 flex-wrap">
            {data && <ResetPasswordButton userId={userId} variant="inline" />}
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Закрыть
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border bg-card px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium leading-tight">{value}</div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  highlight,
  small,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  highlight?: 'emerald';
  small?: boolean;
}) {
  return (
    <div className="rounded-md border bg-muted/30 p-3 text-center">
      <div className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-background text-muted-foreground mb-1.5">
        {icon}
      </div>
      <div
        className={
          'tabular-nums font-semibold leading-none ' +
          (small ? 'text-sm' : 'text-lg ') +
          (highlight === 'emerald' ? 'text-emerald-700 dark:text-emerald-400' : '')
        }
      >
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
