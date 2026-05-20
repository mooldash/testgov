'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type FilterProgram = { id: string; nameRu: string };

const STATUS_OPTIONS = [
  { value: '', label: 'Статус: любой' },
  { value: 'active', label: 'Активные' },
  { value: 'soon7', label: 'Истекает ≤ 7 дн.' },
  { value: 'soon30', label: 'Истекает ≤ 30 дн.' },
  { value: 'expired', label: 'Истёкшие' },
];

const SOURCE_OPTIONS = [
  { value: '', label: 'Источник: любой' },
  { value: 'PURCHASE', label: 'Оплачен' },
  { value: 'MANUAL', label: 'Вручную' },
];

const PAID_OPTIONS = [
  { value: '', label: 'Оплата: любая' },
  { value: 'paid', label: 'Платные' },
  { value: 'free', label: 'Бесплатные' },
];

const CREATED_OPTIONS = [
  { value: '', label: 'Создан: всё время' },
  { value: 'today', label: 'Сегодня' },
  { value: '7d', label: 'За 7 дней' },
  { value: '30d', label: 'За 30 дней' },
];

export function AccessFilters({
  programs,
  total,
  filtered,
}: {
  programs: FilterProgram[];
  total: number;
  filtered: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const initialQ = params.get('q') ?? '';
  const [q, setQ] = useState(initialQ);

  // Debounced search push to URL
  useEffect(() => {
    if (q === initialQ) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (q) next.set('q', q);
      else next.delete('q');
      router.replace(`${pathname}?${next.toString()}`);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`);
  }

  const activeCount = ['q', 'program', 'status', 'source', 'paid', 'created'].filter(
    (k) => params.get(k)
  ).length;

  function reset() {
    setQ('');
    router.replace(pathname);
  }

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по email, имени, программе, тарифу…"
            className="pl-8 h-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <FilterSelect
          value={params.get('program') ?? ''}
          onChange={(v) => setParam('program', v)}
          options={[
            { value: '', label: 'Программа: все' },
            ...programs.map((p) => ({ value: p.id, label: p.nameRu })),
          ]}
        />

        <FilterSelect
          value={params.get('status') ?? ''}
          onChange={(v) => setParam('status', v)}
          options={STATUS_OPTIONS}
        />

        <FilterSelect
          value={params.get('source') ?? ''}
          onChange={(v) => setParam('source', v)}
          options={SOURCE_OPTIONS}
        />

        <FilterSelect
          value={params.get('paid') ?? ''}
          onChange={(v) => setParam('paid', v)}
          options={PAID_OPTIONS}
        />

        <FilterSelect
          value={params.get('created') ?? ''}
          onChange={(v) => setParam('created', v)}
          options={CREATED_OPTIONS}
        />

        {activeCount > 0 && (
          <Button size="sm" variant="ghost" onClick={reset}>
            <X className="h-3.5 w-3.5 mr-1" />
            Сбросить ({activeCount})
          </Button>
        )}
      </div>

      {activeCount > 0 && (
        <div className="text-xs text-muted-foreground px-1">
          Найдено <span className="font-medium text-foreground">{filtered}</span> из {total}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const isActive = value !== '';
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={
        'h-9 rounded-md border bg-background px-3 text-sm transition-colors ' +
        (isActive ? 'border-primary bg-primary/5 font-medium' : 'border-input')
      }
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
