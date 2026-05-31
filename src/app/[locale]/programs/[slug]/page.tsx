import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { BookOpen, Target, Calendar, GraduationCap } from 'lucide-react';
import { isLocale, dbLocale } from '@/i18n/config';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { hasProgramAccess } from '@/lib/access';
import { formatDate, pluckLocalized } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TariffCards } from './TariffCards';
import { ProgramShell } from '@/components/program/ProgramShell';
import { JsonLd } from '@/components/seo/JsonLd';
import { ReviewsSection } from './ReviewsSection';

const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3005';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const program = await prisma.program.findUnique({
    where: { slug },
    select: { nameRu: true, nameKk: true, descriptionRu: true, descriptionKk: true },
  });
  if (!program) return {};
  const t = await getTranslations({ locale, namespace: 'seo' });
  const name = pluckLocalized(program, 'name', locale);
  const desc = pluckLocalized(program, 'description', locale) || t('home_description');
  return {
    title: t('program_template', { name }),
    description: desc,
    alternates: {
      canonical: `/${locale}/programs/${slug}`,
      languages: {
        ru: `/ru/programs/${slug}`,
        kk: `/kk/programs/${slug}`,
        'x-default': `/ru/programs/${slug}`,
      },
    },
    openGraph: {
      title: t('program_template', { name }),
      description: desc,
      url: `/${locale}/programs/${slug}`,
      type: 'website',
    },
  };
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();

  const programRaw = await prisma.program.findUnique({
    where: { slug },
    include: {
      category: true,
      tariffs: { where: { isPublished: true }, orderBy: { order: 'asc' } },
      modules: {
        orderBy: { order: 'asc' },
        include: {
          module: {
            include: {
              contents: { where: { locale: dbLocale(locale) } },
              tests: {
                where: { locale: dbLocale(locale), isPublished: true },
                select: { id: true, title: true, _count: { select: { questions: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!programRaw) notFound();
  // Flatten ProgramModule[] → modules (preserving order from the join table)
  const program = {
    ...programRaw,
    modules: programRaw.modules
      .filter((pm) => pm.module.isPublished)
      .map((pm) => pm.module),
  };

  const session = await auth();
  let access: { expiresAt: Date } | null = null;
  if (session?.user) {
    const a = await prisma.userAccess.findFirst({
      where: { userId: session.user.id, programId: program.id, expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: 'desc' },
    });
    if (a) access = { expiresAt: a.expiresAt };
  }
  const allowed =
    session?.user?.role === 'ADMIN' || Boolean(access) || program.isDemo;

  // Reviews: own + published others
  const reviewsRaw = await prisma.review.findMany({
    where: {
      programId: program.id,
      OR: [
        { isPublished: true },
        ...(session?.user ? [{ userId: session.user.id }] : []),
      ],
    },
    include: { user: { select: { name: true, email: true, id: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const reviews = reviewsRaw.map((r) => ({
    id: r.id,
    rating: r.rating,
    text: r.text,
    isPublished: r.isPublished,
    createdAt: r.createdAt,
    userName: r.user.name || r.user.email.split('@')[0],
    userId: r.user.id,
  }));
  const canReview = Boolean(session?.user && access);

  // ────────── LMS view (has access) ──────────
  if (allowed) {
    const totalTests = program.modules.reduce(
      (sum, m) => sum + (m.type === 'TEST_COLLECTION' ? m.tests.length : 0),
      0
    );
    const totalQuestions = program.modules.reduce(
      (sum, m) =>
        sum + m.tests.reduce((s, t) => s + (t._count?.questions ?? 0), 0),
      0
    );
    const lawModulesCount = program.modules.filter((m) => m.type === 'LAW').length;

    return (
      <ProgramShell programId={program.id} locale={locale} current={{ type: 'overview' }}>
        <div className="p-6 md:p-10 max-w-4xl">
          {program.category && (
            <div className="text-sm text-muted-foreground mb-2">
              {pluckLocalized(program.category, 'name', locale)}
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {pluckLocalized(program, 'name', locale)}
          </h1>
          {pluckLocalized(program, 'description', locale) && (
            <p className="mt-3 text-muted-foreground max-w-3xl">
              {pluckLocalized(program, 'description', locale)}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {access && (
              <Badge variant="success">
                {t('program.owned_until', { date: formatDate(access.expiresAt, locale) })}
              </Badge>
            )}
            {session?.user?.role === 'ADMIN' && !access && <Badge variant="secondary">ADMIN</Badge>}
            {program.isDemo && !access && (
              <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">
                {locale === 'kk' ? 'Тегін демо' : 'Бесплатное демо'}
              </Badge>
            )}
          </div>

          {program.isDemo && !session?.user && (
            <div className="mt-6 rounded-lg border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 p-4 flex items-start gap-3">
              <div className="text-2xl">🎁</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-emerald-900 dark:text-emerald-200">
                  {locale === 'kk'
                    ? 'Сіз демо-режимдесіз — тіркеу қажет емес'
                    : 'Вы в демо-режиме — регистрация не нужна'}
                </div>
                <p className="text-sm text-emerald-900/80 dark:text-emerald-300/80 mt-1">
                  {locale === 'kk'
                    ? 'Барлық материалдар мен тесттер ашық. Бірақ нәтижелер сақталмайды — оларды кабинетте сақтау үшін '
                    : 'Все материалы и тесты открыты. Но результаты не сохраняются — чтобы вести историю в кабинете, '}
                  <Link
                    href={`/${locale}/register`}
                    className="font-medium underline underline-offset-2 hover:no-underline"
                  >
                    {locale === 'kk' ? 'тегін тіркеліңіз' : 'зарегистрируйтесь бесплатно'}
                  </Link>
                  .
                </p>
              </div>
            </div>
          )}

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Target className="h-5 w-5" />}
              value={totalTests}
              label={locale === 'kk' ? 'Тесттер' : 'Тестов'}
            />
            <StatCard
              icon={<GraduationCap className="h-5 w-5" />}
              value={totalQuestions}
              label={locale === 'kk' ? 'Сұрақтар' : 'Вопросов'}
            />
            <StatCard
              icon={<BookOpen className="h-5 w-5" />}
              value={lawModulesCount}
              label={locale === 'kk' ? 'Материалдар' : 'Материалов'}
            />
            <StatCard
              icon={<Calendar className="h-5 w-5" />}
              value={
                access
                  ? Math.max(
                      0,
                      Math.ceil((access.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    )
                  : '∞'
              }
              label={locale === 'kk' ? 'Күн қалды' : 'Дней осталось'}
            />
          </div>

          <h2 className="text-xl font-semibold mt-12 mb-4">
            {locale === 'kk' ? 'Бағдарлама мазмұны' : 'Содержание программы'}
          </h2>
          <div className="space-y-2">
            {program.modules.map((m, idx) => {
              if (m.type === 'LAW') {
                const title =
                  m.contents[0]?.title ?? (locale === 'kk' ? 'Оқу материалы' : 'Учебный материал');
                return (
                  <Link
                    key={m.id}
                    href={`/${locale}/modules/${m.id}`}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg border bg-card hover:border-primary/60 transition-colors group"
                  >
                    <span className="text-xs font-mono text-muted-foreground w-6 shrink-0">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <BookOpen className="h-4 w-4" />
                    </span>
                    <span className="flex-1 font-medium group-hover:text-primary">{title}</span>
                    <Badge variant="outline">{t('module.law_content')}</Badge>
                  </Link>
                );
              }
              const tst = m.tests[0];
              if (!tst) return null;
              return (
                <Link
                  key={m.id}
                  href={`/${locale}/tests/${tst.id}`}
                  className="flex items-center gap-4 px-4 py-3 rounded-lg border bg-card hover:border-primary/60 transition-colors group"
                >
                  <span className="text-xs font-mono text-muted-foreground w-6 shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Target className="h-4 w-4" />
                  </span>
                  <span className="flex-1 font-medium group-hover:text-primary">{tst.title}</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {tst._count?.questions ?? 0}{' '}
                    {locale === 'kk' ? 'сұрақ' : 'вопросов'}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="mt-12">
            <ReviewsSection
              programId={program.id}
              reviews={reviews}
              currentUserId={session?.user?.id ?? null}
              canReview={canReview}
              locale={locale}
            />
          </div>
        </div>
      </ProgramShell>
    );
  }

  // ────────── Marketing view (no access) ──────────
  const programName = pluckLocalized(program, 'name', locale);
  const programDesc = pluckLocalized(program, 'description', locale) ?? '';
  const minPriceTenge = programRaw.tariffs.length
    ? Math.min(...programRaw.tariffs.map((tr) => tr.priceTenge))
    : null;

  const courseLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: programName,
    description: programDesc,
    url: `${baseUrl}/${locale}/programs/${program.slug}`,
    inLanguage: locale,
    provider: {
      '@type': 'EducationalOrganization',
      name: 'testgov.kz',
      sameAs: baseUrl,
    },
    ...(minPriceTenge != null && {
      offers: {
        '@type': 'Offer',
        price: minPriceTenge,
        priceCurrency: 'KZT',
        availability: 'https://schema.org/InStock',
        url: `${baseUrl}/${locale}/programs/${program.slug}`,
      },
    }),
  };
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
      ...(program.category
        ? [{
            '@type': 'ListItem',
            position: 2,
            name: pluckLocalized(program.category, 'name', locale),
            item: `${baseUrl}/${locale}/categories/${program.category.slug}`,
          }]
        : []),
      {
        '@type': 'ListItem',
        position: program.category ? 3 : 2,
        name: programName,
        item: `${baseUrl}/${locale}/programs/${program.slug}`,
      },
    ],
  };

  return (
    <div className="container py-12">
      <JsonLd data={[courseLd, breadcrumbsLd]} />
      {program.category ? (
        <Link
          href={`/${locale}/categories/${program.category.slug}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {pluckLocalized(program.category, 'name', locale)}
        </Link>
      ) : (
        <Link
          href={`/${locale}/categories`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {locale === 'kk' ? 'Барлық санаттар' : 'Все категории'}
        </Link>
      )}

      <div className="mt-2 mb-10 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-semibold">{pluckLocalized(program, 'name', locale)}</h1>
        <p className="text-muted-foreground mt-2">{pluckLocalized(program, 'description', locale)}</p>
      </div>

      <h2 className="text-xl font-semibold mb-2">
        {locale === 'kk' ? 'Тарифті таңдаңыз' : 'Выберите тариф'}
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        {locale === 'kk'
          ? 'Дайындалу мерзіміңізге сәйкес жоспарды таңдаңыз. Барлық тесттер мен материалдар үш тарифте де қол жетімді.'
          : 'Подберите план под свой срок подготовки. Все тесты и материалы доступны во всех трёх тарифах.'}
      </p>

      <div className="mb-12">
        <TariffCards
          programId={program.id}
          tariffs={programRaw.tariffs.map((t) => ({
            id: t.id,
            key: t.key,
            nameRu: t.nameRu,
            nameKk: t.nameKk,
            durationDays: t.durationDays,
            priceTenge: t.priceTenge,
            featuresRu: t.featuresRu,
            featuresKk: t.featuresKk,
            recommended: t.recommended,
          }))}
          locale={locale}
          authed={Boolean(session?.user)}
        />
      </div>

      <h2 className="text-xl font-semibold mb-4">{t('program.modules')}</h2>
      <div className="space-y-3">
        {program.modules.map((m) => {
          const lawTitle = m.contents[0]?.title;
          return (
            <Card key={m.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {m.type === 'LAW'
                      ? lawTitle ?? t('module.law_content')
                      : m.tests[0]?.title ?? `${t('module.tests')} #${m.order}`}
                  </CardTitle>
                  <Badge variant="outline">{m.type === 'LAW' ? t('module.law_content') : t('module.tests')}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t('program.no_access')}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 max-w-4xl">
        <ReviewsSection
          programId={program.id}
          reviews={reviews}
          currentUserId={session?.user?.id ?? null}
          canReview={canReview}
          locale={locale}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
        {icon}
      </div>
      <div className="text-2xl font-bold leading-none">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
