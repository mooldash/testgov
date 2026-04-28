import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { auth, signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './LanguageSwitcher';
import type { AppLocale } from '@/i18n/config';

export async function Header({ locale }: { locale: AppLocale }) {
  const t = await getTranslations({ locale });
  const session = await auth();

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href={`/${locale}`} className="font-semibold tracking-tight text-lg">
            {t('site.name')}
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
            <Link href={`/${locale}/categories`} className="hover:text-foreground transition-colors">
              {t('nav.categories')}
            </Link>
            {session?.user && (
              <Link href={`/${locale}/dashboard`} className="hover:text-foreground transition-colors">
                {t('nav.dashboard')}
              </Link>
            )}
            {session?.user?.role === 'ADMIN' && (
              <Link href="/admin" className="hover:text-foreground transition-colors">
                {t('nav.admin')}
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher currentLocale={locale} />
          {session?.user ? (
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: `/${locale}` });
              }}
            >
              <Button variant="ghost" size="sm" type="submit">
                {t('nav.logout')}
              </Button>
            </form>
          ) : (
            <>
              <Link href={`/${locale}/login`}>
                <Button variant="ghost" size="sm">
                  {t('nav.login')}
                </Button>
              </Link>
              <Link href={`/${locale}/register`}>
                <Button size="sm">{t('nav.register')}</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
