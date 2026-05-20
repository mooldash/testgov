'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

export function LocaleToggle({ current }: { current: 'RU' | 'KK' }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function switchTo(locale: 'RU' | 'KK') {
    const next = new URLSearchParams(params.toString());
    next.set('lang', locale);
    router.replace(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="inline-flex h-9 items-stretch rounded-md border bg-card overflow-hidden">
      {(['RU', 'KK'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          className={cn(
            'inline-flex items-center px-4 text-sm font-medium transition-colors',
            current === l
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          {l === 'RU' ? 'Русский' : 'Қазақша'}
        </button>
      ))}
    </div>
  );
}
