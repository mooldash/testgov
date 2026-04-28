import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { hasTestAccess } from '@/lib/access';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StartTestButton } from './StartTestButton';

export default async function TestStartPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();

  const test = await prisma.test.findUnique({
    where: { id },
    include: {
      module: { include: { program: true } },
      _count: { select: { questions: true, attempts: true } },
    },
  });
  if (!test) notFound();

  const session = await auth();
  if (test.requireAuth && !session?.user) {
    redirect(`/${locale}/login`);
  }

  let allowed = !test.requireAuth;
  let attemptsUsed = 0;
  if (session?.user) {
    allowed = await hasTestAccess(session.user.id, test.id);
    attemptsUsed = await prisma.attempt.count({
      where: { userId: session.user.id, testId: test.id, finishedAt: { not: null } },
    });
  }
  const attemptsLeft = test.maxAttempts == null ? null : Math.max(0, test.maxAttempts - attemptsUsed);

  return (
    <div className="container max-w-2xl py-12">
      <Link
        href={`/${locale}/modules/${test.moduleId}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {t('test.back_to_module')}
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
}
