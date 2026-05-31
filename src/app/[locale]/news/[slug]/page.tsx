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

  // Sidebar: other published articles, newest first, exclude the current one.
  const otherArticles = await prisma.article.findMany({
    where: { isPublished: true, NOT: { id: a.id } },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    select: { slug: true, titleRu: true, titleKk: true, publishedAt: true },
    take: 10,
  });

  return (
    <article className="container py-12">
      <Link
        href={`/${locale}/news`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {isKk ? 'Барлық жаңалықтар' : 'Все новости'}
      </Link>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] gap-10">
        <div className="min-w-0">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>

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
            className="prose-content mt-8 max-w-3xl"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        </div>

        {otherArticles.length > 0 && (
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-xl border bg-card p-5">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-4">
                {isKk ? 'Сондай-ақ оқыңыз' : 'Читайте также'}
              </h2>
              <ul className="space-y-3">
                {otherArticles.map((o) => {
                  const oTitle = isKk ? o.titleKk : o.titleRu;
                  return (
                    <li key={o.slug}>
                      <Link
                        href={`/${locale}/news/${o.slug}`}
                        className="group block"
                      >
                        <span className="block text-sm font-medium leading-snug group-hover:text-primary transition-colors">
                          {oTitle}
                        </span>
                        {o.publishedAt && (
                          <span className="block text-xs text-muted-foreground mt-1 tabular-nums">
                            {new Intl.DateTimeFormat(isKk ? 'kk-KZ' : 'ru-RU', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              timeZone: 'Asia/Almaty',
                            }).format(o.publishedAt)}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        )}
      </div>
    </article>
  );
}
