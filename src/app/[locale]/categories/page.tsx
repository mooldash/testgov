import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { prisma } from '@/lib/prisma';
import { pluckLocalized } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'seo' });
  return {
    title: t('categories_title'),
    description: t('categories_description'),
    alternates: {
      canonical: `/${locale}/categories`,
      languages: { ru: '/ru/categories', kk: '/kk/categories', 'x-default': '/ru/categories' },
    },
  };
}

export default async function CategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();

  const categories = await prisma.category.findMany({
    orderBy: { order: 'asc' },
    include: { _count: { select: { programs: true } } },
  });

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-semibold mb-8">{t('categories.title')}</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        {categories.map((c) => (
          <Link key={c.id} href={`/${locale}/categories/${c.slug}`} className="group">
            <Card className="border-2 border-transparent ring-1 ring-border transition-colors group-hover:ring-primary group-hover:border-primary/30">
              <CardHeader>
                <CardTitle>{pluckLocalized(c, 'name', locale)}</CardTitle>
                <CardDescription>{pluckLocalized(c, 'description', locale)}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {c._count.programs} {t('categories.programs_count')}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
