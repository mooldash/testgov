'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NavGuardLink({
  href,
  className,
  children,
  locale = 'ru',
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  locale?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Warn on hard navigation (refresh, close tab, type new URL)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Don't intercept if it's a link to the current page
  if (href === pathname) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  const labels = {
    ru: {
      title: 'Сейчас идёт тест',
      body: 'Если вы перейдёте на другую страницу, текущая попытка останется незавершённой. Уверены, что хотите выйти?',
      cancel: 'Остаться',
      confirm: 'Выйти из теста',
    },
    kk: {
      title: 'Қазір тест жүріп жатыр',
      body: 'Басқа бетке өтсеңіз, ағымдағы әрекет аяқталмай қалады. Шынымен шыққыңыз келе ме?',
      cancel: 'Қалу',
      confirm: 'Тесттен шығу',
    },
  } as const;
  const L = (labels as Record<string, (typeof labels)['ru']>)[locale] ?? labels.ru;

  return (
    <>
      <a
        href={href}
        className={className}
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      >
        {children}
      </a>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="nav-guard-title"
        >
          <div
            className="w-full max-w-sm rounded-xl border bg-card shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 id="nav-guard-title" className="font-semibold leading-tight">
                  {L.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{L.body}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                {L.cancel}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  router.push(href);
                }}
              >
                {L.confirm}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
