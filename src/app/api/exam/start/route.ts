import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasProgramAccess } from '@/lib/access';
import { buildExamChapters, totalExamQuestions } from '@/lib/exam-engine';
import { isLocale } from '@/i18n/config';

const Schema = z.object({
  moduleId: z.string(),
  programId: z.string(),
  locale: z.enum(['ru', 'kk']),
});

/**
 * POST /api/exam/start
 * Body: { moduleId, programId, locale }
 * Creates an ExamAttempt with a frozen snapshot of randomly-picked questions.
 */
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const { moduleId, programId, locale } = parsed.data;
  if (!isLocale(locale)) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }

  const module = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!module || module.type !== 'EXAM') {
    return NextResponse.json({ error: 'Exam module not found' }, { status: 404 });
  }

  // Module must belong to the program
  const link = await prisma.programModule.findUnique({
    where: { programId_moduleId: { programId, moduleId } },
  });
  if (!link) {
    return NextResponse.json({ error: 'Module not attached to program' }, { status: 400 });
  }

  // Access check (demo programs allow anonymous attempts)
  const allowed = await hasProgramAccess(userId, programId);
  if (!allowed) {
    return NextResponse.json({ error: 'No access' }, { status: 403 });
  }

  const questionsPerTest = module.examQuestionsPerTest ?? 15;
  const chapters = await buildExamChapters({ programId, locale, questionsPerTest });

  if (totalExamQuestions(chapters) === 0) {
    return NextResponse.json(
      { error: 'No questions available — программа не содержит тестов с вопросами' },
      { status: 400 }
    );
  }

  const attempt = await prisma.examAttempt.create({
    data: {
      userId,
      moduleId,
      programId,
      chapters: chapters as object,
    },
  });

  return NextResponse.json({ attemptId: attempt.id });
}
