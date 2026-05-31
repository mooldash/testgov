import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isExamExpired, type ExamChapter } from '@/lib/exam-engine';

const Schema = z.object({
  questionId: z.string(),
  answerId: z.string().nullable(),
});

/**
 * POST /api/exam/[id]/answer
 * Save or update a single answer in an active exam attempt.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await auth();

  const attempt = await prisma.examAttempt.findUnique({
    where: { id },
    include: {
      module: { select: { examTimeLimitSec: true } },
      program: { select: { isDemo: true } },
    },
  });
  if (!attempt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Ownership check: matches Attempt's behaviour
  if (attempt.userId) {
    if (attempt.userId !== session?.user?.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  } else if (!attempt.program.isDemo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (attempt.finishedAt) {
    return NextResponse.json({ error: 'Already finished' }, { status: 400 });
  }
  if (isExamExpired(attempt.startedAt, attempt.module.examTimeLimitSec)) {
    return NextResponse.json({ error: 'Time expired' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const { questionId, answerId } = parsed.data;

  // Question must belong to this attempt
  const chapters = attempt.chapters as unknown as ExamChapter[];
  const allowedIds = new Set(chapters.flatMap((c) => c.questionIds));
  if (!allowedIds.has(questionId)) {
    return NextResponse.json({ error: 'Question not in this attempt' }, { status: 400 });
  }

  let isCorrect = false;
  if (answerId) {
    const ans = await prisma.answer.findUnique({ where: { id: answerId } });
    if (!ans || ans.questionId !== questionId) {
      return NextResponse.json({ error: 'Answer mismatch' }, { status: 400 });
    }
    isCorrect = ans.isCorrect;
  }

  await prisma.examAnswer.upsert({
    where: { examAttemptId_questionId: { examAttemptId: attempt.id, questionId } },
    update: { answerId, isCorrect, answeredAt: new Date() },
    create: { examAttemptId: attempt.id, questionId, answerId, isCorrect },
  });

  // Reveal correct answer immediately — exam mode always shows feedback
  // (could be a module setting later if needed)
  const correctAnswer = await prisma.answer.findFirst({
    where: { questionId, isCorrect: true },
    select: { id: true },
  });

  return NextResponse.json({
    ok: true,
    isCorrect,
    correctAnswerId: correctAnswer?.id ?? null,
  });
}
