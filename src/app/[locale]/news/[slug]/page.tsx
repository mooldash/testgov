import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Calendar, User } from 'lucide-react';
import { isLocale } from '@/i18n/config';
import { prisma } from '@/lib/prisma';
import { getSetting, SETTING_KEYS } from '@/lib/settings';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const a = await prisma.article.findUnique({ where: { slug } });
  if (!a) return {};
  const isKk = locale === 'kk';
  const title = isKk ? a.titleKk : a.titleRu;
  const desc = (isKk ? a.excerptKk : a.excerptRu) || title;
  return {
    title,
    description: desc,
    alternates: {
      canonical: `/${locale}/news/${slug}`,
      languages: {
        ru: `/ru/news/${slug}`,
        kk: `/kk/news/${slug}`,
        'x-default': `/ru/news/${slug}`,
      },
    },
    openGraph: { title, description: desc, type: 'article' },
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const isKk = locale === 'kk';

  const [a, author] = await Promise.all([
    prisma.article.findUnique({ where: { slug } }),
    getSetting(isKk ? SETTING_KEYS.NEWS_AUTHOR_KK : SETTING_KEYS.NEWS_AUTHOR_RU),
  ]);
  if (!a || !a.isPublished) notFound();

  const title = isKk ? a.titleKk : a.titleRu;
  const body = isKk ? a.bodyKk : a.bodyRu;

  return (
    <article className="container py-12">
      <div className="max-w-3xl">
      <Link
        href={`/${locale}/news`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {isKk ? 'Барлық жаңалықтар' : 'Все новости'}
      </Link>

      <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>

      <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          {a.publishedAt
            ? new Intl.DateTimeFormat(isKk ? 'kk-KZ' : 'ru-RU', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                timeZone: 'Asia/Almaty',
              }).format(a.publishedAt)
            : '—'}
        </span>
        {author && (
          <span className="inline-flex items-center gap-1.5">
            <User className="h-4 w-4" />
            {author}
          </span>
        )}
      </div>

      {a.coverUrl && (
        <div className="mt-6 aspect-[16/9] rounded-xl overflow-hidden border bg-muted">
          <img src={a.coverUrl} alt={title} className="h-full w-full object-cover" />
        </div>
      )}

      <div
        className="prose-content mt-8"
        dangerouslySetInnerHTML={{ __html: body }}
      />
      </div>
    </article>
  );
}
