'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTenge, cn } from '@/lib/utils';

export type ClientTariff = {
  id: string;
  key: string;
  nameRu: string;
  nameKk: string;
  durationDays: number;
  priceTenge: number;
  featuresRu: string[];
  featuresKk: string[];
  recommended: boolean;
};

export function TariffCards({
  programId,
  tariffs,
  locale,
  authed,
}: {
  programId: string;
  tariffs: ClientTariff[];
  locale: 'ru' | 'kk';
  authed: boolean;
}) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  async function pick(tariffId: string) {
    if (!authed) {
      router.push(`/${locale}/login`);
      return;
    }
    setPendingKey(tariffId);
    const res = await fetch('/api/payments/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ programId, tariffId }),
    });
    setPendingKey(null);
    if (!res.ok) {
      alert('Ошибка оплаты');
      return;
    }
    const data = (await res.json()) as { redirectUrl: string };
    router.push(data.redirectUrl);
  }

  if (tariffs.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/40 p-6 text-center text-muted-foreground">
        {locale === 'kk' ? 'Тарифтер әлі қосылмаған.' : 'Тарифы пока не настроены.'}
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {tariffs.map((t) => {
        const name = locale === 'kk' ? t.nameKk : t.nameRu;
        const features = locale === 'kk' ? t.featuresKk : t.featuresRu;
        const isPending = pendingKey === t.id;
        const perDay = Math.round(t.priceTenge / Math.max(1, t.durationDays));
        return (
          <Card
            key={t.id}
            className={cn(
              'relative flex flex-col transition-colors',
              t.recommended
                ? 'border-2 border-primary shadow-md'
                : 'border-2 border-transparent ring-1 ring-border hover:ring-primary/60'
            )}
          >
            {t.recommended && (
              <Badge
                variant="default"
                className="absolute -top-3 left-1/2 -translate-x-1/2 gap-1"
              >
                <Sparkles className="h-3 w-3" />
                {locale === 'kk' ? 'Ұсынылады' : 'Рекомендуем'}
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="text-xl">{name}</CardTitle>
              <div className="text-sm text-muted-foreground">
                {locale === 'kk' ? `${t.durationDays} күн` : `${t.durationDays} дней`}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-5">
                <div className="text-3xl font-bold tabular-nums">{formatTenge(t.priceTenge)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {locale === 'kk'
                    ? `${perDay.toLocaleString('ru-RU')} ₸ / күн`
                    : `${perDay.toLocaleString('ru-RU')} ₸ / день`}
                </div>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => pick(t.id)}
                disabled={isPending}
                size="lg"
                variant={t.recommended ? 'default' : 'outline'}
                className="w-full"
              >
                {isPending
                  ? locale === 'kk'
                    ? 'Күтіңіз…'
                    : 'Подождите…'
                  : locale === 'kk'
                    ? 'Таңдау'
                    : 'Выбрать'}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
