import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { auth, signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SupportLink } from './SupportLink';
import { MobileMenu } from './MobileMenu';
import type { AppLocale } from '@/i18n/config';

export async function Header({ locale }: { locale: AppLocale }) {
  const t = await getTranslations({ locale });
  const session = await auth();
  const isAuthed = !!session?.user;
  const isAdmin = session?.user?.role === 'ADMIN';

  async function handleSignOut() {
    'use server';
    await signOut({ redirectTo: `/${locale}` });
  }

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-3 md:gap-6">
          <MobileMenu
            locale={locale}
            isAuthed={isAuthed}
            isAdmin={isAdmin}
            signOutAction={isAuthed ? handleSignOut : undefined}
          />
          <Link href={`/${locale}`} className="font-semibold tracking-tight text-lg">
            {t('site.name')}
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
            <Link href={`/${locale}/categories`} className="hover:text-foreground transition-colors">
              {t('nav.categories')}
            </Link>
            <Link href={`/${locale}/news`} className="hover:text-foreground transition-colors">
              {t('nav.news')}
            </Link>
            <Link href={`/${locale}/contacts`} className="hover:text-foreground transition-colors">
              {t('nav.contacts')}
            </Link>
            {isAuthed && (
              <Link href={`/${locale}/dashboard`} className="hover:text-foreground transition-colors">
                {t('nav.dashboard')}
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" className="hover:text-foreground transition-colors">
                {t('nav.admin')}
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <SupportLink locale={locale} />
          <LanguageSwitcher currentLocale={locale} />
          {isAuthed ? (
            <form action={handleSignOut} className="hidden md:block">
              <Button variant="ghost" size="sm" type="submit">
                {t('nav.logout')}
              </Button>
            </form>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Link href={`/${locale}/login`}>
                <Button variant="ghost" size="sm">
                  {t('nav.login')}
                </Button>
              </Link>
              <Link href={`/${locale}/register`}>
                <Button size="sm">{t('nav.register')}</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
