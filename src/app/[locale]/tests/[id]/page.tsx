import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';

export const metadata: Metadata = { robots: { index: false, follow: false } };
import { isLocale } from '@/i18n/config';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { hasTestAccess, hasProgramAccess } from '@/lib/access';
import { Card, CardContent } from '@/components/ui/card';
import { StartTestButton } from './StartTestButton';
import { ProgramShell } from '@/components/program/ProgramShell';

export default async function TestStartPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ program?: string }>;
}) {
  const { locale, id } = await params;
  const { program: programIdParam } = await searchParams;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();

  const test = await prisma.test.findUnique({
    where: { id },
    include: {
      module: {
        include: {
          programs: { select: { program: { select: { id: true, slug: true, isDemo: true } } } },
        },
      },
      _count: { select: { questions: true, attempts: true } },
    },
  });
  if (!test) notFound();

  const session = await auth();
  const programs = test.module.programs.map((pm) => pm.program);
  const isDemoTest = programs.some((p) => p.isDemo);
  // Auth gate: paid tests still require login; demo tests are open to all
  if (test.requireAuth && !isDemoTest && !session?.user) {
    redirect(`/${locale}/login`);
  }

  // Pick the program context — prefer a demo program for anonymous, otherwise an owned one
  const programIds = programs.map((p) => p.id);
  let programId = programIdParam && programIds.includes(programIdParam) ? programIdParam : null;
  if (!programId) {
    for (const p of programs) {
      const ok = await hasProgramAccess(session?.user?.id ?? null, p.id);
      if (ok) {
        programId = p.id;
        break;
      }
    }
  }
  if (!programId) programId = programIds[0] ?? null;

  const allowed = await hasTestAccess(session?.user?.id ?? null, test.id);
  let attemptsUsed = 0;
  if (session?.user) {
    attemptsUsed = await prisma.attempt.count({
      where: { userId: session.user.id, testId: test.id, finishedAt: { not: null } },
    });
  }
  const attemptsLeft = test.maxAttempts == null ? null : Math.max(0, test.maxAttempts - attemptsUsed);

  // Back link goes to the parent program overview (not the bare module —
  // since each TEST_COLLECTION module wraps a single test, the module page
  // would just show the same test card and be useless click).
  const programObj = programs.find((p) => p.id === programId);
  const backHref = programObj ? `/${locale}/programs/${programObj.slug}` : `/${locale}/categories`;
  const backLabel = locale === 'kk' ? 'Бағдарламаға' : 'К программе';

  const content = (
    <div className="p-6 md:p-10 max-w-2xl">
      <Link
        href={backHref}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {backLabel}
      </Link>
      <h1 className="text-3xl font-semibold mt-2 mb-6">{test.title}</h1>

      <Card>
        <CardContent className="pt-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('test.questions_count', { n: test._count.questions })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {test.timeLimitSec
                ? t('test.time_limit', { minutes: Math.floor(test.timeLimitSec / 60) })
                : t('test.no_time_limit')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {test.maxAttempts == null
                ? t('test.unlimited_attempts')
                : t('test.max_attempts', { n: test.maxAttempts })}
              {attemptsLeft != null && ` (${attemptsLeft})`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('test.passing_score', { n: test.passingScore })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t('test.mode', { mode: t(`test.mode_${test.mode}` as 'test.mode_CLASSIC') })}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        {!allowed ? (
          <p className="text-sm text-destructive">{t('test.no_access')}</p>
        ) : attemptsLeft === 0 ? (
          <p className="text-sm text-destructive">{t('test.no_attempts_left')}</p>
        ) : (
          <StartTestButton testId={test.id} locale={locale} label={t('test.start')} />
        )}
      </div>
    </div>
  );

  if (programId) {
    return (
      <ProgramShell
        programId={programId}
        locale={locale}
        current={{ type: 'test', id: test.id }}
      >
        {content}
      </ProgramShell>
    );
  }
  return <div className="container">{content}</div>;
}
