import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { LoginForm } from './LoginForm';
import { RegisterForm } from '../register/RegisterForm';
import { LogIn, UserPlus } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'seo' });
  return {
    title: t('login_title'),
    alternates: {
      canonical: `/${locale}/login`,
      languages: { ru: '/ru/login', kk: '/kk/login', 'x-default': '/ru/login' },
    },
  };
}

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  const isKk = locale === 'kk';

  return (
    <div className="container py-12 md:py-16">
      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* Login */}
        <div className="rounded-xl border bg-card p-6 md:p-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LogIn className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-semibold">{t('auth.login_title')}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            {isKk ? 'Тіркелгіге кіріңіз' : 'Войдите в свой аккаунт'}
          </p>
          <LoginForm
            labels={{
              email: t('auth.email'),
              password: t('auth.password'),
              submit: t('auth.submit_login'),
              invalid: t('auth.invalid_credentials'),
            }}
            locale={locale}
          />
        </div>

        {/* Register */}
        <div className="rounded-xl border bg-card p-6 md:p-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <UserPlus className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-semibold">{t('auth.register_title')}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            {isKk ? 'Жаңа тіркелгі құрыңыз' : 'Создайте новый аккаунт'}
          </p>
          <RegisterForm
            labels={{
              name: t('auth.name'),
              email: t('auth.email'),
              password: t('auth.password'),
              phone: isKk ? 'Телефон нөмірі' : 'Номер телефона',
              submit: t('auth.submit_register'),
              failed: t('auth.register_failed'),
            }}
            locale={locale}
          />
        </div>
      </div>
    </div>
  );
}
