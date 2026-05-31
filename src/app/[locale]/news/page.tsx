import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { prisma } from '@/lib/prisma';
import { NewsGrid } from './NewsGrid';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const isKk = locale === 'kk';
  return {
    title: isKk ? 'Жаңалықтар' : 'Новости',
    description: isKk
      ? 'testgov.kz платформасының жаңалықтары мен дайындық бойынша мақалалар.'
      : 'Новости платформы testgov.kz и материалы по подготовке к госэкзамену.',
    alternates: {
      canonical: `/${locale}/news`,
      languages: { ru: '/ru/news', kk: '/kk/news', 'x-default': '/ru/news' },
    },
  };
}

export default async function NewsListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const isKk = locale === 'kk';

  const rows = await prisma.article.findMany({
    where: { isPublished: true, publishedAt: { lte: new Date() } },
    orderBy: { publishedAt: 'desc' },
    take: 50,
  });

  const articles = rows.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: isKk ? a.titleKk : a.titleRu,
    excerpt: isKk ? a.excerptKk : a.excerptRu,
    coverUrl: a.coverUrl,
    publishedAt: a.publishedAt,
  }));

  return (
    <div className="container py-12">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
        {isKk ? 'Жаңалықтар' : 'Новости'}
      </h1>
      <p className="text-muted-foreground mb-10 max-w-2xl">
        {isKk
          ? 'Платформаның жаңартулары, заңдағы өзгерістер және дайындық бойынша кеңестер.'
          : 'Обновления платформы, изменения в законодательстве и советы по подготовке.'}
      </p>

      {articles.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {isKk ? 'Әзірге жаңалықтар жоқ.' : 'Пока нет публикаций.'}
        </p>
      ) : (
        <NewsGrid articles={articles} locale={locale} />
      )}
    </div>
  );
}
