import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { isLocale } from '@/i18n/config';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { sanitizeHtml } from '@/lib/sanitize';
import {
  examTimeLeftSec,
  loadExamForRunner,
  type ExamChapter,
} from '@/lib/exam-engine';
import { ExamRunner } from '@/components/exam-runner/ExamRunner';
import { ProgramShell } from '@/components/program/ProgramShell';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ExamRunPage({
  params,
}: {
  params: Promise<{ locale: string; attemptId: string }>;
}) {
  const { locale, attemptId } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      module: { select: { examTimeLimitSec: true } },
      program: { select: { isDemo: true, slug: true } },
    },
  });
  if (!attempt) notFound();

  // Anonymous attempts only allowed for demo programs
  if (!attempt.userId && !attempt.program.isDemo) {
    redirect(`/${locale}/login`);
  }
  if (attempt.userId && session?.user?.id !== attempt.userId) {
    redirect(`/${locale}/programs/${attempt.program.slug}`);
  }

  // Finished — go to result page
  if (attempt.finishedAt) {
    redirect(`/${locale}/exam/${attempt.id}/result`);
  }

  const chapters = attempt.chapters as unknown as ExamChapter[];
  const hydrated = await loadExamForRunner(chapters);

  // Sanitize HTML on the server
  const safeChapters = hydrated.map((c) => ({
    testId: c.testId,
    testTitle: c.testTitle,
    questions: c.questions.map((q) => ({
      id: q.id,
      textHtml: sanitizeHtml(q.textHtml),
      answers: q.answers.map((a) => ({
        id: a.id,
        textHtml: sanitizeHtml(a.textHtml),
      })),
    })),
  }));

  const timeLeftSec = examTimeLeftSec(attempt.startedAt, attempt.module.examTimeLimitSec);

  return (
    <ProgramShell
      programId={attempt.programId}
      locale={locale}
      current={{ type: 'module', id: attempt.moduleId }}
      guarded
    >
      <ExamRunner
        attemptId={attempt.id}
        locale={locale}
        chapters={safeChapters}
        timeLeftSec={timeLeftSec}
        resultPath={`/${locale}/exam/${attempt.id}/result`}
      />
    </ProgramShell>
  );
}
