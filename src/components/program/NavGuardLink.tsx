'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

/**
 * Wraps a navigation link with a confirmation modal — used inside the test
 * runner's sidebar so the user doesn't accidentally lose an in-progress
 * attempt. The modal is rendered via Radix Portal (DialogContent), which
 * mounts in document.body — required because the sidebar uses `sticky` and
 * creates its own stacking context, which would clip a locally-positioned
 * overlay underneath answer cards.
 */
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1.5">
                <DialogTitle className="leading-tight">{L.title}</DialogTitle>
                <DialogDescription className="leading-relaxed">{L.body}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
