'use client';

import Link from 'next/link';
import { KeyRound, History, CreditCard, Settings, ChevronRight, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AccountSettings } from './AccountSettings';
import { formatDate, formatDateTime, pluckLocalized, formatTenge } from '@/lib/utils';

type AccessRow = {
  id: string;
  expiresAt: Date;
  program: {
    slug: string;
    nameRu: string;
    nameKk: string;
    descriptionRu: string | null;
    descriptionKk: string | null;
  };
};

type AttemptRow = {
  id: string;
  finishedAt: Date | null;
  score: number | null;
  passed: boolean | null;
  test: { title: string };
};

type OrderRow = {
  id: string;
  amountTenge: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  tariffKey: string | null;
  durationDays: number | null;
  createdAt: Date;
  program: { slug: string; nameRu: string; nameKk: string };
};

const STATUS_LABEL = {
  PENDING: 'В ожидании',
  PAID: 'Оплачен',
  FAILED: 'Ошибка',
  REFUNDED: 'Возвращён',
} as const;

const STATUS_VARIANT: Record<OrderRow['status'], 'secondary' | 'success' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  PAID: 'success',
  FAILED: 'destructive',
  REFUNDED: 'outline',
};

export function DashboardTabs({
  locale,
  user,
  access,
  attempts,
  orders,
  labels,
}: {
  locale: 'ru' | 'kk';
  user: { name: string; email: string };
  access: AccessRow[];
  attempts: AttemptRow[];
  orders: OrderRow[];
  labels: {
    tabAccess: string;
    tabResults: string;
    tabOrders: string;
    tabSettings: string;
    noAccess: string;
    noHistory: string;
    noOrders: string;
    expiresAt: string;
    testName: string;
    date: string;
    score: string;
    result: string;
    view: string;
    resultPassed: string;
    resultFailed: string;
  };
}) {
  return (
    <Tabs defaultValue="access">
      <TabsList className="h-auto p-1 flex-wrap gap-1">
        <TabsTrigger value="access" className="gap-2">
          <KeyRound className="h-3.5 w-3.5" />
          {labels.tabAccess}
          {access.length > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-[10px] font-medium text-primary">
              {access.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="results" className="gap-2">
          <History className="h-3.5 w-3.5" />
          {labels.tabResults}
          {attempts.length > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-medium">
              {attempts.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="orders" className="gap-2">
          <CreditCard className="h-3.5 w-3.5" />
          {labels.tabOrders}
          {orders.length > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-medium">
              {orders.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="settings" className="gap-2">
          <Settings className="h-3.5 w-3.5" />
          {labels.tabSettings}
        </TabsTrigger>
      </TabsList>

      {/* Access */}
      <TabsContent value="access">
        {access.length === 0 ? (
          <EmptyState text={labels.noAccess} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {access.map((a) => {
              const name = pluckLocalized(a.program, 'name', locale);
              const desc = pluckLocalized(a.program, 'description', locale);
              return (
                <Card key={a.id} className="hover:border-primary/60 transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      <Link
                        href={`/${locale}/programs/${a.program.slug}`}
                        className="hover:text-primary inline-flex items-center gap-1 group"
                      >
                        {name}
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {desc && <p className="text-xs text-muted-foreground line-clamp-2">{desc}</p>}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {labels.expiresAt}: {formatDate(a.expiresAt, locale)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </TabsContent>

      {/* Results */}
      <TabsContent value="results">
        {attempts.length === 0 ? (
          <EmptyState text={labels.noHistory} />
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="p-3 font-medium">{labels.testName}</th>
                  <th className="p-3 font-medium w-40">{labels.date}</th>
                  <th className="p-3 font-medium w-20">{labels.score}</th>
                  <th className="p-3 font-medium w-32">{labels.result}</th>
                  <th className="p-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="p-3">{a.test.title}</td>
                    <td className="p-3 text-muted-foreground">
                      {a.finishedAt ? formatDateTime(a.finishedAt, locale) : '—'}
                    </td>
                    <td className="p-3 font-medium tabular-nums">{a.score}%</td>
                    <td className="p-3">
                      {a.passed ? (
                        <Badge variant="success">{labels.resultPassed}</Badge>
                      ) : (
                        <Badge variant="destructive">{labels.resultFailed}</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/${locale}/dashboard/attempts/${a.id}`}
                        className="text-primary hover:underline text-xs"
                      >
                        {labels.view} →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TabsContent>

      {/* Orders */}
      <TabsContent value="orders">
        {orders.length === 0 ? (
          <EmptyState text={labels.noOrders} />
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="p-3 font-medium">Программа</th>
                  <th className="p-3 font-medium w-32">Тариф</th>
                  <th className="p-3 font-medium w-28 text-right">Сумма</th>
                  <th className="p-3 font-medium w-32">Статус</th>
                  <th className="p-3 font-medium w-40">Дата</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="p-3">
                      <Link
                        href={`/${locale}/programs/${o.program.slug}`}
                        className="hover:text-primary"
                      >
                        {pluckLocalized(o.program, 'name', locale)}
                      </Link>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {o.tariffKey
                        ? `${o.tariffKey}${o.durationDays ? ` · ${o.durationDays} дн.` : ''}`
                        : '—'}
                    </td>
                    <td className="p-3 text-right tabular-nums">{formatTenge(o.amountTenge)}</td>
                    <td className="p-3">
                      <Badge variant={STATUS_VARIANT[o.status]}>{STATUS_LABEL[o.status]}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{formatDateTime(o.createdAt, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TabsContent>

      {/* Settings */}
      <TabsContent value="settings">
        <AccountSettings initialName={user.name} initialEmail={user.email} />
      </TabsContent>
    </Tabs>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 py-12 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
