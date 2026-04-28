import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { isLocale } from '@/i18n/config';
import { notFound } from 'next/navigation';

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div>
      <section className="container py-20 md:py-28">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">{t('landing.hero_title')}</h1>
          <p className="mt-5 text-lg md:text-xl text-muted-foreground max-w-2xl">{t('landing.hero_subtitle')}</p>
          <div className="mt-8 flex gap-3">
            <Link href={`/${locale}/categories`}>
              <Button size="lg">{t('landing.cta_browse')}</Button>
            </Link>
            <Link href={`/${locale}/login`}>
              <Button size="lg" variant="outline">
                {t('landing.cta_login')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border p-6 bg-card">
              <div className="text-sm font-mono text-muted-foreground mb-3">0{i}</div>
              <h3 className="text-lg font-semibold mb-2">{t(`landing.feature_${i}_title`)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(`landing.feature_${i}_text`)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
