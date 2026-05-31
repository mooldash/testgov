import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { scoreAttempt } from '@/lib/test-engine';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
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

  const isDemoAttempt = attempt.test.module.programs.some((pm) => pm.program.isDemo);
  if (attempt.userId) {
    if (attempt.userId !== session?.user?.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  } else if (!isDemoAttempt) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (attempt.finishedAt) {
    return NextResponse.json({
      attemptId: attempt.id,
      score: attempt.score,
      passed: attempt.passed,
    });
  }

  const result = await scoreAttempt(attempt, attempt.test);

  const updated = await prisma.attempt.update({
    where: { id: attempt.id },
    data: { finishedAt: new Date(), score: result.score, passed: result.passed },
  });

  return NextResponse.json({
    attemptId: updated.id,
    score: result.score,
    passed: result.passed,
    total: result.total,
    correct: result.correct,
  });
}
