import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { CheckCircle2, XCircle, UserPlus } from 'lucide-react';
import { isLocale } from '@/i18n/config';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AnonResultPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; attemptId: string }>;
}) {
  const { locale, id: testId, attemptId } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const isKk = locale === 'kk';

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      test: {
        include: {
          module: { include: { programs: { include: { program: { select: { slug: true, isDemo: true } } } } } },
        },
      },
      answers: true,
    },
  });
  if (!attempt || attempt.testId !== testId) notFound();
  if (!attempt.finishedAt) notFound();
  // This public page is only for demo (anonymous) attempts
  const isDemoAttempt = attempt.test.module.programs.some((pm) => pm.program.isDemo);
  if (!isDemoAttempt) notFound();

  const total = (attempt.questionOrder as string[]).length;
  const correct = attempt.answers.filter((a) => a.isCorrect).length;
  const passed = attempt.passed ?? false;
  const score = attempt.score ?? 0;
  const programSlug = attempt.test.module.programs[0]?.program.slug;

  return (
    <div className="container py-12 max-w-2xl">
      <Card>
        <CardContent className="pt-8 pb-8 text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            {passed ? (
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            ) : (
              <XCircle className="h-9 w-9 text-destructive" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {passed
                ? isKk
                  ? 'Сіз тапсырдыңыз!'
                  : 'Вы сдали!'
                : isKk
                  ? 'Бұл жолы тапсыра алмадыңыз'
                  : 'В этот раз не сдали'}
            </h1>
            <p className="text-muted-foreground mt-2">{attempt.test.title}</p>
          </div>

          <div className="flex justify-center gap-8 text-sm">
            <div>
              <div className="text-3xl font-bold tabular-nums">{score}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                {isKk ? 'Баллыңыз' : 'Ваш балл'}
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold tabular-nums">
                {correct}/{total}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {isKk ? 'Дұрыс жауаптар' : 'Правильных ответов'}
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold tabular-nums">{attempt.test.passingScore}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                {isKk ? 'Өту балы' : 'Проходной'}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-left">
            <div className="flex items-start gap-3">
              <UserPlus className="h-5 w-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-semibold text-emerald-900 dark:text-emerald-200">
                  {isKk
                    ? 'Нәтижені сақтап, тарихты жүргізгіңіз келе ме?'
                    : 'Хотите сохранить результат и вести историю?'}
                </div>
                <div className="text-emerald-900/80 dark:text-emerald-300/80 mt-1">
                  {isKk
                    ? 'Тегін тіркеліңіз — әр әрекеттің статистикасы жеке кабинетте сақталады.'
                    : 'Бесплатная регистрация — статистика всех попыток будет в личном кабинете.'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center pt-2">
            <Link href={`/${locale}/register`}>
              <Button>{isKk ? 'Тегін тіркелу' : 'Зарегистрироваться бесплатно'}</Button>
            </Link>
            <Link href={`/${locale}/tests/${testId}`}>
              <Button variant="outline">
                {isKk ? 'Тағы бір рет' : 'Пройти ещё раз'}
              </Button>
            </Link>
            {programSlug && (
              <Link href={`/${locale}/programs/${programSlug}`}>
                <Button variant="ghost">
                  ← {isKk ? 'Бағдарламаға қайту' : 'К программе'}
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
