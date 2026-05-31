import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAnswerCorrect, isAttemptExpired } from '@/lib/test-engine';

const Schema = z.object({
  questionId: z.string(),
  answerId: z.string().nullable(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await auth();

  const attempt = await prisma.attempt.findUnique({
    where: { id },
    include: {
      test: {
        include: {
          module: { include: { programs: { select: { program: { select: { isDemo: true } } } } } },
        },
      },
    },
  });
  if (!attempt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Anonymous attempts are only allowed if at least one parent program is demo
  const isDemoAttempt = attempt.test.module.programs.some((pm) => pm.program.isDemo);
  if (attempt.userId) {
    if (attempt.userId !== session?.user?.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  } else if (!isDemoAttempt) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (attempt.finishedAt) return NextResponse.json({ error: 'Already finished' }, { status: 400 });
  if (isAttemptExpired(attempt, attempt.test)) {
    return NextResponse.json({ error: 'Time expired' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { questionId, answerId } = parsed.data;
  const qIds = attempt.questionOrder as string[];
  if (!qIds.includes(questionId)) {
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

  await prisma.attemptAnswer.upsert({
    where: { attemptId_questionId: { attemptId: attempt.id, questionId } },
    update: { answerId, isCorrect, answeredAt: new Date() },
    create: { attemptId: attempt.id, questionId, answerId, isCorrect },
  });

  const reveal = attempt.test.showCorrectAnswers || attempt.test.showScoreDuring;
  if (!reveal) return NextResponse.json({ ok: true });

  const correctAnswer = await prisma.answer.findFirst({
    where: { questionId, isCorrect: true },
    select: { id: true },
  });

  return NextResponse.json({
    ok: true,
    isCorrect,
    correctAnswerId: attempt.test.showCorrectAnswers ? correctAnswer?.id ?? null : null,
  });
}
