import { prisma } from '@/lib/prisma';
import { dbLocale, type AppLocale } from '@/i18n/config';

/**
 * Per-chapter snapshot stored in `ExamAttempt.chapters` as JSON.
 * The shape is frozen at exam start so the user always sees the
 * same questions in the same order even if admin later edits tests.
 */
export interface ExamChapter {
  testId: string;
  testTitle: string;
  questionIds: string[];
}

/**
 * Randomly shuffle in place via Fisher-Yates and return a NEW array.
 * Used both for picking N questions per test and (optionally) for answer order.
 */
function shuffled<T>(input: readonly T[]): T[] {
  const out = [...input];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * Build chapters for an exam attempt:
 * - find all TEST_COLLECTION modules of the program for the user's locale
 * - take their first published test
 * - pick `examQuestionsPerTest` random question IDs (or all if test has fewer)
 *
 * Tests with no questions are skipped.
 */
export async function buildExamChapters({
  programId,
  locale,
  questionsPerTest,
}: {
  programId: string;
  locale: AppLocale;
  questionsPerTest: number;
}): Promise<ExamChapter[]> {
  const programModules = await prisma.programModule.findMany({
    where: {
      programId,
      module: { type: 'TEST_COLLECTION', isPublished: true },
    },
    orderBy: { order: 'asc' },
    include: {
      module: {
        include: {
          tests: {
            where: { locale: dbLocale(locale), isPublished: true },
            include: { questions: { select: { id: true } } },
          },
        },
      },
    },
  });

  const chapters: ExamChapter[] = [];
  for (const pm of programModules) {
    const test = pm.module.tests[0];
    if (!test) continue;
    const all = test.questions.map((q) => q.id);
    if (all.length === 0) continue;
    const picked = shuffled(all).slice(0, Math.min(questionsPerTest, all.length));
    chapters.push({
      testId: test.id,
      testTitle: test.title,
      questionIds: picked,
    });
  }
  return chapters;
}

/**
 * Question + its answers, hydrated for the runner view.
 * The shape mirrors what `test-engine.loadQuestionsForAttempt` returns.
 */
export interface ExamRunnerQuestion {
  id: string;
  textHtml: string;
  explanationHtml: string | null;
  mediaUrl: string | null;
  youtubeId: string | null;
  answers: Array<{ id: string; textHtml: string }>;
}

export interface ExamRunnerChapter {
  testId: string;
  testTitle: string;
  questions: ExamRunnerQuestion[];
}

/**
 * Hydrate the JSON chapter snapshot into full question/answer records.
 * Returns chapters in the order they were stored.
 */
export async function loadExamForRunner(
  chapters: ExamChapter[]
): Promise<ExamRunnerChapter[]> {
  const allIds = chapters.flatMap((c) => c.questionIds);
  if (allIds.length === 0) return [];

  const rows = await prisma.question.findMany({
    where: { id: { in: allIds } },
    include: { answers: { orderBy: { order: 'asc' } } },
  });
  const byId = new Map(rows.map((q) => [q.id, q]));

  return chapters.map((c) => ({
    testId: c.testId,
    testTitle: c.testTitle,
    questions: c.questionIds.flatMap((qid) => {
      const q = byId.get(qid);
      if (!q) return [];
      return [
        {
          id: q.id,
          textHtml: q.textHtml,
          explanationHtml: q.explanationHtml,
          mediaUrl: q.mediaUrl,
          youtubeId: q.youtubeId,
          // Answers are NOT shuffled per-user — keeping the admin order stable.
          answers: q.answers.map((a) => ({ id: a.id, textHtml: a.textHtml })),
        },
      ];
    }),
  }));
}

/**
 * Score an exam attempt by counting correct ExamAnswer rows
 * over the total question count. Returns 0-100 score + pass/fail.
 */
export async function scoreExamAttempt(
  attemptId: string,
  totalQuestions: number,
  passingScore: number
): Promise<{ score: number; passed: boolean; correct: number; total: number }> {
  const correct = await prisma.examAnswer.count({
    where: { examAttemptId: attemptId, isCorrect: true },
  });
  const score = totalQuestions === 0 ? 0 : Math.round((correct / totalQuestions) * 100);
  return {
    score,
    passed: score >= passingScore,
    correct,
    total: totalQuestions,
  };
}

/**
 * Total question count across all chapters of an attempt.
 */
export function totalExamQuestions(chapters: ExamChapter[]): number {
  return chapters.reduce((sum, c) => sum + c.questionIds.length, 0);
}

/**
 * Seconds remaining for a timed exam. Returns null if no time limit.
 */
export function examTimeLeftSec(
  startedAt: Date,
  timeLimitSec: number | null | undefined
): number | null {
  if (!timeLimitSec) return null;
  const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  return Math.max(0, timeLimitSec - elapsed);
}

export function isExamExpired(
  startedAt: Date,
  timeLimitSec: number | null | undefined
): boolean {
  if (!timeLimitSec) return false;
  const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  return elapsed >= timeLimitSec;
}
