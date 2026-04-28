import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale } from '@/i18n/config';
import { notFound } from 'next/navigation';
import { LoginForm } from './LoginForm';

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="container max-w-md py-16">
      <h1 className="text-2xl font-semibold mb-6">{t('auth.login_title')}</h1>
      <LoginForm
        labels={{
          email: t('auth.email'),
          password: t('auth.password'),
          submit: t('auth.submit_login'),
          invalid: t('auth.invalid_credentials'),
        }}
        locale={locale}
      />
      <p className="text-sm text-muted-foreground mt-4">
        {t('auth.no_account')}{' '}
        <Link href={`/${locale}/register`} className="text-primary underline-offset-2 hover:underline">
          {t('auth.submit_register')}
        </Link>
      </p>
    </div>
  );
}
