import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { isLocale } from '@/i18n/config';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { loadQuestionsForAttempt, timeLeftSec } from '@/lib/test-engine';
import { sanitizeHtml } from '@/lib/sanitize';
import { TestRunner } from '@/components/test-runner/TestRunner';

export default async function RunPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ attempt?: string }>;
}) {
  const { locale, id: testId } = await params;
  const { attempt: attemptId } = await searchParams;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);
  if (!attemptId) redirect(`/${locale}/tests/${testId}`);

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { test: true },
  });
  if (!attempt || attempt.userId !== session.user.id || attempt.testId !== testId) {
    redirect(`/${locale}/tests/${testId}`);
  }
  if (attempt.finishedAt) {
    redirect(`/${locale}/dashboard/attempts/${attempt.id}`);
  }

  // For INSTANT_FEEDBACK we DON'T pre-reveal correct answers; client gets correctness per-answer
  const questions = await loadQuestionsForAttempt(attempt, attempt.test, { revealCorrect: false });

  // Sanitize HTML server-side before sending to client
  const sanitized = questions.map((q) => ({
    ...q,
    textHtml: sanitizeHtml(q.textHtml),
    answers: q.answers.map((a) => ({ ...a, textHtml: sanitizeHtml(a.textHtml) })),
  }));

  return (
    <div className="container max-w-3xl py-8">
      <TestRunner
        attemptId={attempt.id}
        testId={testId}
        locale={locale}
        mode={attempt.test.mode}
        questions={sanitized}
        timeLeftSec={timeLeftSec(attempt, attempt.test)}
        requireAnswer={attempt.test.requireAnswer}
      />
    </div>
  );
}
