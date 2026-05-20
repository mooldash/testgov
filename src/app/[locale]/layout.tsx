import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isLocale, locales } from '@/i18n/config';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { Providers } from '@/components/site/Providers';
import { ExpiryBanner } from '@/components/site/ExpiryBanner';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'seo' });

  return {
    title: { default: t('home_title'), template: `%s | ${t('site_short')}` },
    description: t('home_description'),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ru: '/ru',
        kk: '/kk',
        'x-default': '/ru',
      },
    },
    openGraph: {
      title: t('home_title'),
      description: t('home_description'),
      locale: locale === 'kk' ? 'kk_KZ' : 'ru_RU',
      alternateLocale: locale === 'kk' ? ['ru_RU'] : ['kk_KZ'],
      url: `/${locale}`,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Providers>
        <div className="flex flex-col min-h-screen">
          <Header locale={locale} />
          <ExpiryBanner locale={locale} />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </div>
      </Providers>
    </NextIntlClientProvider>
  );
}
