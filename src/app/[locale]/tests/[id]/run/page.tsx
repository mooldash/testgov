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
  if (!attemptId) redirect(`/${locale}/tests/${testId}`);

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      test: {
        include: {
          module: {
            include: { programs: { select: { program: { select: { id: true, isDemo: true } } } } },
          },
        },
      },
    },
  });
  if (!attempt || attempt.testId !== testId) {
    redirect(`/${locale}/tests/${testId}`);
  }
  // Anonymous attempts are only allowed if at least one parent program is demo
  const isDemoAttempt = attempt.test.module.programs.some((pm) => pm.program.isDemo);
  if (!attempt.userId && !isDemoAttempt) {
    redirect(`/${locale}/login`);
  }
  if (attempt.userId && session?.user?.id !== attempt.userId) {
    redirect(`/${locale}/tests/${testId}`);
  }
  if (attempt.finishedAt) {
    if (attempt.userId) {
      redirect(`/${locale}/dashboard/attempts/${attempt.id}`);
    } else {
      // anonymous: send back to test start page
      redirect(`/${locale}/tests/${testId}`);
    }
  }

  // Resolve program context
  const programs = attempt.test.module.programs.map((pm) => pm.program);
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
        resultPath={
          attempt.userId
            ? `/${locale}/dashboard/attempts/${attempt.id}`
            : `/${locale}/tests/${testId}/result/${attempt.id}`
        }
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
