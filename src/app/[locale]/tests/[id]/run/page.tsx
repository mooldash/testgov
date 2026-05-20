import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { isLocale } from '@/i18n/config';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { loadQuestionsForAttempt, timeLeftSec } from '@/lib/test-engine';
import { sanitizeHtml } from '@/lib/sanitize';
import { TestRunner } from '@/components/test-runner/TestRunner';
import { ProgramShell } from '@/components/program/ProgramShell';
import { hasProgramAccess } from '@/lib/access';

export default async function RunPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ attempt?: string; program?: string }>;
}) {
  const { locale, id: testId } = await params;
  const { attempt: attemptId, program: programIdParam } = await searchParams;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);
  if (!attemptId) redirect(`/${locale}/tests/${testId}`);

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      test: {
        include: {
          module: {
            include: { programs: { select: { programId: true } } },
          },
        },
      },
    },
  });
  if (!attempt || attempt.userId !== session.user.id || attempt.testId !== testId) {
    redirect(`/${locale}/tests/${testId}`);
  }
  if (attempt.finishedAt) {
    redirect(`/${locale}/dashboard/attempts/${attempt.id}`);
  }

  // Resolve program context
  const programIds = attempt.test.module.programs.map((pm) => pm.programId);
  let programId = programIdParam && programIds.includes(programIdParam) ? programIdParam : null;
  if (!programId) {
    for (const pid of programIds) {
      if (await hasProgramAccess(session.user.id, pid)) {
        programId = pid;
        break;
      }
    }
  }
  if (!programId) programId = programIds[0] ?? null;

  const questions = await loadQuestionsForAttempt(attempt, attempt.test, { revealCorrect: false });

  const sanitized = questions.map((q) => ({
    ...q,
    textHtml: sanitizeHtml(q.textHtml),
    answers: q.answers.map((a) => ({ ...a, textHtml: sanitizeHtml(a.textHtml) })),
  }));

  const runner = (
    <div className="p-6 md:p-8 max-w-3xl">
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

  if (programId) {
    return (
      <ProgramShell
        programId={programId}
        locale={locale}
        current={{ type: 'test', id: testId }}
        guarded
      >
        {runner}
      </ProgramShell>
    );
  }
  return <div className="container">{runner}</div>;
}
