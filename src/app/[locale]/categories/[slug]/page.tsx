import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { prisma } from '@/lib/prisma';
import { formatTenge, pluckLocalized } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      programs: {
        where: { isPublished: true },
        orderBy: { order: 'asc' },
      },
    },
  });
  if (!category) notFound();

  return (
    <div className="container py-12">
      <Link href={`/${locale}/categories`} className="text-sm text-muted-foreground hover:text-foreground">
        ← {t('common.back')}
      </Link>
      <h1 className="text-3xl font-semibold mt-2 mb-2">{pluckLocalized(category, 'name', locale)}</h1>
      <p className="text-muted-foreground mb-8">{pluckLocalized(category, 'description', locale)}</p>

      <div className="grid sm:grid-cols-2 gap-4">
        {category.programs.map((p) => (
          <Link key={p.id} href={`/${locale}/programs/${p.slug}`} className="group">
            <Card className="transition-shadow group-hover:shadow-md h-full">
              <CardHeader>
                <CardTitle>{pluckLocalized(p, 'name', locale)}</CardTitle>
                <CardDescription>{pluckLocalized(p, 'description', locale)}</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-between items-end">
                <div className="text-sm text-muted-foreground">{t('program.duration', { days: p.durationDays })}</div>
                <div className="font-semibold">{formatTenge(p.priceTenge)}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
