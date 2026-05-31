'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AppLocale } from '@/i18n/config';

interface Props {
  locale: AppLocale;
  isAuthed: boolean;
  isAdmin: boolean;
  signOutAction?: () => Promise<void>;
}

export function MobileMenu({ locale, isAuthed, isAdmin, signOutAction }: Props) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const linkClass =
    'block w-full py-3 text-base text-foreground hover:text-primary transition-colors border-b border-border/40';

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={locale === 'kk' ? 'Мәзірді ашу' : 'Открыть меню'}
          className="md:hidden inline-flex h-9 w-9 items-center justify-center -ml-2 rounded-md hover:bg-muted/60 transition-colors"
        >
          <span className="sr-only">menu</span>
          <span className="flex flex-col items-stretch gap-[5px] w-6">
            <span className="block h-px bg-foreground" />
            <span className="block h-px bg-foreground" />
            <span className="block h-px bg-foreground" />
          </span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
        />
        <Dialog.Content
          className="fixed inset-y-0 left-0 z-50 flex w-[82vw] max-w-xs flex-col border-r bg-background p-5 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left duration-200"
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold tracking-tight">
              {t('site.name')}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={locale === 'kk' ? 'Жабу' : 'Закрыть'}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            {locale === 'kk' ? 'Навигация мәзірі' : 'Навигационное меню'}
          </Dialog.Description>

          <nav className="flex flex-col">
            <Link href={`/${locale}/categories`} className={linkClass} onClick={close}>
              {t('nav.categories')}
            </Link>
            <Link href={`/${locale}/news`} className={linkClass} onClick={close}>
              {t('nav.news')}
            </Link>
            <Link href={`/${locale}/contacts`} className={linkClass} onClick={close}>
              {t('nav.contacts')}
            </Link>
            {isAuthed && (
              <Link href={`/${locale}/dashboard`} className={linkClass} onClick={close}>
                {t('nav.dashboard')}
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" className={linkClass} onClick={close}>
                {t('nav.admin')}
              </Link>
            )}
          </nav>

          <div className="mt-auto pt-6 flex flex-col gap-2">
            {isAuthed ? (
              signOutAction && (
                <form action={signOutAction}>
                  <Button variant="outline" size="sm" type="submit" className="w-full">
                    {t('nav.logout')}
                  </Button>
                </form>
              )
            ) : (
              <>
                <Link href={`/${locale}/login`} onClick={close}>
                  <Button variant="outline" size="sm" className="w-full">
                    {t('nav.login')}
                  </Button>
                </Link>
                <Link href={`/${locale}/register`} onClick={close}>
                  <Button size="sm" className="w-full">
                    {t('nav.register')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
