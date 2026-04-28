import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasTestAccess } from '@/lib/access';
import { selectQuestionsForAttempt } from '@/lib/test-engine';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await auth();

  const test = await prisma.test.findUnique({ where: { id } });
  if (!test) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (test.requireAuth && !session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session?.user) {
    const ok = await hasTestAccess(session.user.id, test.id);
    if (!ok) return NextResponse.json({ error: 'No access' }, { status: 403 });

    if (test.maxAttempts != null) {
      const used = await prisma.attempt.count({
        where: { userId: session.user.id, testId: test.id, finishedAt: { not: null } },
      });
      if (used >= test.maxAttempts) {
        return NextResponse.json({ error: 'No attempts left' }, { status: 403 });
      }
    }
  }

  const ids = await selectQuestionsForAttempt(test);
  if (ids.length === 0) return NextResponse.json({ error: 'Test has no questions' }, { status: 400 });

  const attempt = await prisma.attempt.create({
    data: {
      userId: session!.user.id,
      testId: test.id,
      questionOrder: ids,
    },
  });

  return NextResponse.json({ attemptId: attempt.id });
}
