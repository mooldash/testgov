import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Award, CheckCircle2, XCircle, UserPlus } from 'lucide-react';
import { isLocale } from '@/i18n/config';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ExamChapter } from '@/lib/exam-engine';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ExamResultPage({
  params,
}: {
  params: Promise<{ locale: string; attemptId: string }>;
}) {
  const { locale, attemptId } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const isKk = locale === 'kk';

  const session = await auth();
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      module: {
        select: {
          examPassingScore: true,
          contents: { where: { locale: isKk ? 'KK' : 'RU' }, select: { title: true } },
        },
      },
      program: { select: { slug: true, isDemo: true, nameRu: true, nameKk: true } },
      answers: { select: { questionId: true, isCorrect: true } },
    },
  });
  if (!attempt || !attempt.finishedAt) notFound();

  // Ownership: anonymous demo attempts are public; authenticated must match
  if (attempt.userId && attempt.userId !== session?.user?.id) {
    notFound();
  }
  if (!attempt.userId && !attempt.program.isDemo) {
    notFound();
  }

  const chapters = attempt.chapters as unknown as ExamChapter[];
  const total = chapters.reduce((s, c) => s + c.questionIds.length, 0);
  const score = attempt.score ?? 0;
  const passed = attempt.passed ?? false;
  const passingScore = attempt.module.examPassingScore ?? 60;

  const correctById = new Set(
    attempt.answers.filter((a) => a.isCorrect).map((a) => a.questionId)
  );
  const totalCorrect = correctById.size;

  const programName = isKk ? attempt.program.nameKk : attempt.program.nameRu;
  const isAnon = !attempt.userId;

  return (
    <div className="container py-12 max-w-3xl">
      <Card>
        <CardContent className="pt-8 pb-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              {passed ? (
                <CheckCircle2 className="h-9 w-9 text-emerald-600" />
              ) : (
                <XCircle className="h-9 w-9 text-destructive" />
              )}
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide inline-flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5" />
                {isKk ? 'Қорытынды емтихан' : 'Итоговый экзамен'}
              </div>
              <h1 className="text-2xl font-bold mt-1">
                {passed
                  ? isKk
                    ? 'Емтиханды тапсырдыңыз!'
                    : 'Экзамен сдан!'
                  : isKk
                    ? 'Бұл жолы тапсыра алмадыңыз'
                    : 'В этот раз не сдали'}
              </h1>
              <p className="text-muted-foreground mt-1">{programName}</p>
            </div>
          </div>

          <div className="flex justify-center gap-8 text-center">
            <div>
              <div className="text-3xl font-bold tabular-nums">{score}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                {isKk ? 'Жалпы балл' : 'Общий балл'}
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold tabular-nums">
                {totalCorrect}/{total}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {isKk ? 'Дұрыс' : 'Верно'}
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold tabular-nums">{passingScore}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                {isKk ? 'Өту балы' : 'Проходной'}
              </div>
            </div>
          </div>

          {/* Per-chapter breakdown */}
          <div className="space-y-2 pt-2">
            <div className="text-sm font-medium text-muted-foreground mb-2">
              {isKk ? 'Чаптерлер бойынша:' : 'По чаптерам:'}
            </div>
            {chapters.map((c, idx) => {
              const correct = c.questionIds.filter((q) => correctById.has(q)).length;
              const tot = c.questionIds.length;
              const pct = tot === 0 ? 0 : Math.round((correct / tot) * 100);
              return (
                <div
                  key={c.testId + idx}
                  className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5"
                >
                  <div className="text-xs font-mono text-muted-foreground w-6 shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{c.testTitle}</div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={
                          pct >= passingScore
                            ? 'h-full bg-emerald-500'
                            : 'h-full bg-amber-500'
                        }
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-medium tabular-nums shrink-0">
                    {correct}/{tot}{' '}
                    <span className="text-xs text-muted-foreground">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>

          {isAnon && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 flex items-start gap-3">
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
          )}

          <div className="flex flex-wrap gap-2 justify-center pt-2">
            {isAnon && (
              <Link href={`/${locale}/register`}>
                <Button>{isKk ? 'Тегін тіркелу' : 'Зарегистрироваться бесплатно'}</Button>
              </Link>
            )}
            <Link href={`/${locale}/programs/${attempt.program.slug}`}>
              <Button variant="outline">
                ← {isKk ? 'Бағдарламаға қайту' : 'К программе'}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
