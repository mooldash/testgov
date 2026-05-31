import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  scoreExamAttempt,
  totalExamQuestions,
  type ExamChapter,
} from '@/lib/exam-engine';

/**
 * POST /api/exam/[id]/finish
 * Finalize attempt, compute score, persist.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await auth();

  const attempt = await prisma.examAttempt.findUnique({
    where: { id },
    include: {
      module: { select: { examPassingScore: true } },
      program: { select: { isDemo: true } },
    },
  });
  if (!attempt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (attempt.userId) {
    if (attempt.userId !== session?.user?.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  } else if (!attempt.program.isDemo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (attempt.finishedAt) {
    return NextResponse.json({
      attemptId: attempt.id,
      score: attempt.score,
      passed: attempt.passed,
    });
  }

  const chapters = attempt.chapters as unknown as ExamChapter[];
  const total = totalExamQuestions(chapters);
  const passingScore = attempt.module.examPassingScore ?? 60;
  const result = await scoreExamAttempt(attempt.id, total, passingScore);

  await prisma.examAttempt.update({
    where: { id: attempt.id },
    data: { finishedAt: new Date(), score: result.score, passed: result.passed },
  });

  return NextResponse.json({
    attemptId: attempt.id,
    score: result.score,
    passed: result.passed,
    total: result.total,
    correct: result.correct,
  });
}
