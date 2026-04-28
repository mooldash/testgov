import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale } from '@/i18n/config';
import { notFound } from 'next/navigation';
import { RegisterForm } from './RegisterForm';

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="container max-w-md py-16">
      <h1 className="text-2xl font-semibold mb-6">{t('auth.register_title')}</h1>
      <RegisterForm
        labels={{
          name: t('auth.name'),
          email: t('auth.email'),
          password: t('auth.password'),
          submit: t('auth.submit_register'),
          failed: t('auth.register_failed'),
        }}
        locale={locale}
      />
      <p className="text-sm text-muted-foreground mt-4">
        {t('auth.have_account')}{' '}
        <Link href={`/${locale}/login`} className="text-primary underline-offset-2 hover:underline">
          {t('auth.submit_login')}
        </Link>
      </p>
    </div>
  );
}
