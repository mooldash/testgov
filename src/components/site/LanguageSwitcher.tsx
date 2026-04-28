'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { AppLocale } from '@/i18n/config';

export function LanguageSwitcher({ currentLocale }: { currentLocale: AppLocale }) {
  const pathname = usePathname();

  function swap(target: AppLocale) {
    if (!pathname) return `/${target}`;
    if (pathname.startsWith('/kk') || pathname.startsWith('/ru')) {
      return `/${target}${pathname.slice(3) || ''}`;
    }
    return `/${target}${pathname}`;
  }

  return (
    <div className="flex items-center gap-1 text-xs border rounded-md p-0.5 bg-muted/50">
      {(['kk', 'ru'] as const).map((l) => (
        <Link
          key={l}
          href={swap(l)}
          className={cn(
            'px-2 py-1 rounded transition-colors',
            currentLocale === l ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
