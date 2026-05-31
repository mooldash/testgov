import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';
import { Clock, FileQuestion, Target, ChevronRight, CheckCircle2, PlayCircle, Star, Gift } from 'lucide-react';
import { isLocale, dbLocale } from '@/i18n/config';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { formatTenge, pluckLocalized } from '@/lib/utils';
import { getBoolSetting, SETTING_KEYS } from '@/lib/settings';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JsonLd } from '@/components/seo/JsonLd';

const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3005';

// ISR: category programs list rarely changes; admin mutations revalidate
// the affected paths in src/app/admin/actions.ts.
export const revalidate = 1800;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return {};
  const t = await getTranslations({ locale, namespace: 'seo' });
  const name = pluckLocalized(category, 'name', locale);
  const desc = pluckLocalized(category, 'description', locale) || t('home_description');
  return {
    title: t('category_template', { name }),
    description: desc,
    alternates: {
      canonical: `/${locale}/categories/${slug}`,
      languages: {
        ru: `/ru/categories/${slug}`,
        kk: `/kk/categories/${slug}`,
        'x-default': `/ru/categories/${slug}`,
      },
    },
    openGraph: {
      title: t('category_template', { name }),
      description: desc,
      url: `/${locale}/categories/${slug}`,
      type: 'website',
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();

  // Note: we deliberately do NOT include modules->module->tests here.
  // Previously this caused 5+ nested SQL roundtrips per category render.
  // Instead we fetch programs cheap (just tariffs.priceTenge) and then run a
  // SINGLE aggregated GROUP BY query for all programs at once — see below.
  const programInclude = {
    tariffs: { where: { isPublished: true }, select: { priceTenge: true } },
  } as const;

  const categoryRaw = await prisma.category.findUnique({
    where: { slug },
    include: {
      programs: {
        where: { isPublished: true },
        // Demo programs always at the bottom of the list
        orderBy: [{ isDemo: 'asc' }, { order: 'asc' }],
        include: programInclude,
      },
      extraPrograms: {
        where: { program: { isPublished: true } },
        orderBy: { order: 'asc' },
        include: { program: { include: programInclude } },
      },
    },
  });
  if (!categoryRaw) notFound();

  // Merge primary + secondary attachments. Dedupe defensively.
  const seen = new Set<string>();
  const mergedPrograms: typeof categoryRaw.programs = [];
  for (const p of categoryRaw.programs) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      mergedPrograms.push(p);
    }
  }
  for (const cp of categoryRaw.extraPrograms) {
    if (!seen.has(cp.program.id)) {
      seen.add(cp.program.id);
      mergedPrograms.push(cp.program);
    }
  }
  // Demo always last across the merged list
  mergedPrograms.sort((a, b) => Number(a.isDemo) - Number(b.isDemo));
  const category = { ...categoryRaw, programs: mergedPrograms };

  // Settings: if enabled and category has exactly one published program, redirect to it
  const directProgram = await getBoolSetting(SETTING_KEYS.CATEGORY_DIRECT_PROGRAM);
  if (directProgram && category.programs.length === 1) {
    redirect(`/${locale}/programs/${category.programs[0].slug}`);
  }

  const session = await auth();
  const ownedProgramIds = new Set<string>();
  if (session?.user) {
    const accesses = await prisma.userAccess.findMany({
      where: {
        userId: session.user.id,
        programId: { in: category.programs.map((p) => p.id) },
        expiresAt: { gt: new Date() },
      },
      select: { programId: true },
    });
    accesses.forEach((a) => ownedProgramIds.add(a.programId));
  }

  // Single aggregated query: for every program in this category get total
  // questions, total time, and average passing score across all published
  // tests of the current locale. Replaces the previous nested include
  // (program→modules→module→tests→_count.questions).
  const programIds = category.programs.map((p) => p.id);
  const programStats = new Map<
    string,
    { totalQuestions: number; totalTimeSec: number; avgPassing: number | null }
  >();
  if (programIds.length) {
    const rows = await prisma.$queryRaw<
      Array<{
        programId: string;
        totalQuestions: number;
        totalTimeSec: number;
        avgPassing: number | null;
      }>
    >`
      SELECT
        pm."programId" AS "programId",
        COALESCE(SUM(qc.cnt), 0)::int AS "totalQuestions",
        COALESCE(SUM(t."timeLimitSec"), 0)::int AS "totalTimeSec",
        AVG(t."passingScore")::int AS "avgPassing"
      FROM "ProgramModule" pm
      JOIN "Test" t ON t."moduleId" = pm."moduleId"
        AND t."locale" = ${dbLocale(locale)}::"Locale"
        AND t."isPublished" = true
      LEFT JOIN (
        SELECT "testId", COUNT(*)::int AS cnt
        FROM "Question"
        GROUP BY "testId"
      ) qc ON qc."testId" = t.id
      WHERE pm."programId" = ANY(${programIds}::text[])
      GROUP BY pm."programId"
    `;
    for (const r of rows) {
      programStats.set(r.programId, {
        totalQuestions: r.totalQuestions,
        totalTimeSec: r.totalTimeSec,
        avgPassing: r.avgPassing,
      });
    }
  }

  const categoryName = pluckLocalized(category, 'name', locale);
  const breadcrumbsLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: locale === 'kk' ? 'Басты бет' : 'Главная',
        item: `${baseUrl}/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: locale === 'kk' ? 'Санаттар' : 'Категории',
        item: `${baseUrl}/${locale}/categories`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: categoryName,
        item: `${baseUrl}/${locale}/categories/${slug}`,
      },
    ],
  };
  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: categoryName,
    itemListElement: category.programs.map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: pluckLocalized(p, 'name', locale),
      url: `${baseUrl}/${locale}/programs/${p.slug}`,
    })),
  };

  return (
    <div className="container py-12">
      <JsonLd data={[breadcrumbsLd, itemListLd]} />
      <Link href={`/${locale}/categories`} className="text-sm text-muted-foreground hover:text-foreground">
        ← {t('common.back')}
      </Link>
      <h1 className="text-3xl font-semibold mt-2 mb-2">{categoryName}</h1>
      <p className="text-muted-foreground mb-8">{pluckLocalized(category, 'description', locale)}</p>

      <div className="space-y-3">
        {category.programs.map((p) => {
          const stats = programStats.get(p.id);
          const totalQuestions = stats?.totalQuestions ?? 0;
          const totalTimeSec = stats?.totalTimeSec ?? 0;
          const totalTimeMin = Math.round(totalTimeSec / 60);
          const avgPassing = stats?.avgPassing ?? null;

          const owned = ownedProgramIds.has(p.id);
          const description = pluckLocalized(p, 'description', locale);
          const name = pluckLocalized(p, 'name', locale);

          return (
            <Card
              key={p.id}
              className={
                'border-2 transition-colors ' +
                (owned
                  ? 'border-emerald-500/40 ring-1 ring-emerald-500/30 hover:ring-emerald-500'
                  : p.isHighlighted
                    ? 'border-amber-500/50 ring-1 ring-amber-500/40 hover:ring-amber-500 bg-amber-50/30 dark:bg-amber-950/10'
                    : p.isDemo
                      ? 'border-emerald-500/30 ring-1 ring-emerald-500/20 hover:ring-emerald-500/60 bg-emerald-50/30 dark:bg-emerald-950/10'
                      : 'border-transparent ring-1 ring-border hover:ring-primary hover:border-primary/30')
              }
            >
              <CardContent className="p-5">
                {/* Title row with optional badges */}
                <div className="flex items-start gap-3 mb-1 flex-wrap">
                  <h3 className="text-lg font-semibold flex-1 leading-tight inline-flex items-center gap-2">
                    {name}
                    {p.isHighlighted && (
                      <Badge className="gap-1 font-medium bg-amber-500 text-white hover:bg-amber-500 shrink-0">
                        <Star className="h-3 w-3" />
                        {locale === 'kk' ? 'Ұсынылады' : 'Рекомендуем'}
                      </Badge>
                    )}
                    {p.isDemo && (
                      <Badge className="gap-1 font-medium bg-emerald-500 text-white hover:bg-emerald-500 shrink-0">
                        <Gift className="h-3 w-3" />
                        {locale === 'kk' ? 'Тегін демо' : 'Бесплатное демо'}
                      </Badge>
                    )}
                  </h3>
                  {owned && (
                    <Badge className="gap-1 font-medium bg-emerald-500 text-white hover:bg-emerald-500 shrink-0">
                      <CheckCircle2 className="h-3 w-3" />
                      {locale === 'kk' ? 'Сатып алынды' : 'Приобретено'}
                    </Badge>
                  )}
                </div>

                {/* Description under title */}
                {description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>
                )}

                {/* Single-row footer: stats + price + button */}
                <div className="flex items-center gap-4 flex-wrap">
                  <InlineStat
                    icon={<Clock className="h-4 w-4" />}
                    value={totalTimeMin > 0 ? `${totalTimeMin}` : '∞'}
                    label={locale === 'kk' ? 'мин' : 'мин'}
                  />
                  <InlineStat
                    icon={<FileQuestion className="h-4 w-4" />}
                    value={String(totalQuestions)}
                    label={locale === 'kk' ? 'сұрақ' : 'вопросов'}
                  />
                  <InlineStat
                    icon={<Target className="h-4 w-4" />}
                    value={avgPassing != null ? `${avgPassing}%` : '—'}
                    label={locale === 'kk' ? 'өту балы' : 'проходной'}
                  />

                  {/* Right-aligned: price + button */}
                  <div className="ml-auto flex items-center gap-4">
                    {owned ? (
                      <>
                        <div className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                          {locale === 'kk' ? 'Қол жетімді' : 'Доступ открыт'}
                        </div>
                        <Link href={`/${locale}/programs/${p.slug}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-emerald-500 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                          >
                            {locale === 'kk' ? 'Ашу' : 'Открыть'}
                            <ChevronRight className="h-3.5 w-3.5 ml-1" />
                          </Button>
                        </Link>
                      </>
                    ) : p.isDemo ? (
                      <>
                        <div className="text-sm text-emerald-700 dark:text-emerald-400 font-medium whitespace-nowrap">
                          {locale === 'kk' ? 'Тіркеусіз' : 'Без регистрации'}
                        </div>
                        <Link href={`/${locale}/programs/${p.slug}`}>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            {locale === 'kk' ? 'Тегін бастау' : 'Начать бесплатно'}
                            <ChevronRight className="h-3.5 w-3.5 ml-1" />
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                          {locale === 'kk' ? 'бастап' : 'от'}{' '}
                          <span className="font-semibold text-foreground">
                            {p.tariffs.length > 0
                              ? formatTenge(Math.min(...p.tariffs.map((t) => t.priceTenge)))
                              : '—'}
                          </span>
                        </div>
                        <Link href={`/${locale}/programs/${p.slug}`}>
                          <Button size="sm">
                            {locale === 'kk' ? 'Таңдау' : 'Выбрать'}
                            <ChevronRight className="h-3.5 w-3.5 ml-1" />
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function InlineStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-muted-foreground">{icon}</span>
      <span className="font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
