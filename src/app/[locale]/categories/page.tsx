import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ChevronRight, GraduationCap, Gift } from 'lucide-react';
import { isLocale } from '@/i18n/config';
import { prisma } from '@/lib/prisma';
import { pluckLocalized } from '@/lib/utils';
import { resolveCategoryIcon } from '@/lib/category-icons';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ISR: categories list rarely changes; admin mutations revalidatePath
// the affected slugs in src/app/admin/actions.ts.
export const revalidate = 1800;

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

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  const isKk = locale === 'kk';

  const categories = await prisma.category.findMany({
    orderBy: { order: 'asc' },
    include: {
      programs: {
        where: { isPublished: true },
        select: { id: true, isDemo: true },
      },
      extraPrograms: {
        where: { program: { isPublished: true } },
        select: { program: { select: { id: true, isDemo: true } } },
      },
    },
  });

  // Merge primary + secondary programs per category (with dedup)
  const merged = categories.map((c) => {
    const seen = new Set<string>();
    const out: { id: string; isDemo: boolean }[] = [];
    for (const p of c.programs) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        out.push(p);
      }
    }
    for (const cp of c.extraPrograms) {
      if (!seen.has(cp.program.id)) {
        seen.add(cp.program.id);
        out.push(cp.program);
      }
    }
    return { ...c, programs: out };
  });

  function plural(n: number, forms: [string, string, string]): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return forms[0];
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
    return forms[2];
  }

  return (
    <div className="container py-12">
      <div className="max-w-2xl mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t('categories.title')}</h1>
        <p className="mt-3 text-muted-foreground">
          {isKk
            ? 'Дайындалу салаңызды таңдаңыз. Әр санатта тегін демо-бағдарламалар бар — тіркеусіз сынап көріңіз.'
            : 'Выберите направление подготовки. В каждой категории есть бесплатная демо-программа — попробуйте без регистрации.'}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {merged.map((c) => {
          const Icon = resolveCategoryIcon(c.iconKey, c.slug);
          const name = pluckLocalized(c, 'name', locale);
          const desc = pluckLocalized(c, 'description', locale);
          const total = c.programs.length;
          const demoCount = c.programs.filter((p) => p.isDemo).length;
          const paidCount = total - demoCount;
          const programsLabel = isKk
            ? `${total} бағдарлама`
            : `${total} ${plural(total, ['программа', 'программы', 'программ'])}`;

          return (
            <Card
              key={c.id}
              className="border-2 border-transparent ring-1 ring-border transition-colors hover:ring-primary hover:border-primary/30 flex flex-col"
            >
              <CardContent className="p-6 flex flex-col flex-1">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-lg leading-tight">{name}</h2>
                    <div className="mt-1 text-xs text-muted-foreground">{programsLabel}</div>
                  </div>
                </div>

                {desc && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                    {desc}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {paidCount}{' '}
                    {isKk
                      ? 'ақылы'
                      : plural(paidCount, ['платная', 'платные', 'платных'])}
                  </span>
                  {demoCount > 0 && (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400 gap-1 px-2"
                    >
                      <Gift className="h-3 w-3" />
                      {isKk ? 'Тегін демо' : 'Бесплатное демо'}
                    </Badge>
                  )}
                </div>

                <Link href={`/${locale}/categories/${c.slug}`} className="block">
                  <Button variant="outline" className="w-full justify-between group">
                    <span>{isKk ? 'Бағдарламаларды көру' : 'Смотреть программы'}</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
