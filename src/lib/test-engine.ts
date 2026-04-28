import { prisma } from '@/lib/prisma';
import { shuffle } from '@/lib/shuffle';
import type { Attempt, Test } from '@prisma/client';

export { shuffle };

export interface QuestionForRun {
  id: string;
  textHtml: string;
  mediaUrl: string | null;
  youtubeId: string | null;
  answers: Array<{ id: string; textHtml: string }>;
  // Only populated when allowed (e.g. admin / showCorrectAnswers / explanation review)
  explanationHtml?: string | null;
  correctAnswerId?: string | null;
}

/**
 * Pick the question id list for a new attempt: shuffle (if enabled), then trim to questionLimit.
 */
export async function selectQuestionsForAttempt(test: Test): Promise<string[]> {
  const questions = await prisma.question.findMany({
    where: { testId: test.id },
    orderBy: { order: 'asc' },
    select: { id: true },
  });
  let ids = questions.map((q) => q.id);
  if (test.shuffleQuestions) ids = shuffle(ids);
  if (test.questionLimit && test.questionLimit > 0 && test.questionLimit < ids.length) {
    ids = ids.slice(0, test.questionLimit);
  }
  return ids;
}

/**
 * Load full questions in the order specified by the attempt snapshot, with answers shuffled if test.shuffleAnswers.
 * Strips correctness unless `revealCorrect` is true.
 */
export async function loadQuestionsForAttempt(
  attempt: Attempt,
  test: Test,
  opts: { revealCorrect?: boolean } = {}
): Promise<QuestionForRun[]> {
  const ids = attempt.questionOrder as string[];
  const questions = await prisma.question.findMany({
    where: { id: { in: ids } },
    include: { answers: { orderBy: { order: 'asc' } } },
  });
  const byId = new Map(questions.map((q) => [q.id, q]));

  return ids
    .map((id) => byId.get(id))
    .filter((q): q is NonNullable<typeof q> => Boolean(q))
    .map((q) => {
      const answers = test.shuffleAnswers ? shuffle(q.answers) : q.answers;
      return {
        id: q.id,
        textHtml: q.textHtml,
        mediaUrl: q.mediaUrl,
        youtubeId: q.youtubeId,
        answers: answers.map((a) => ({ id: a.id, textHtml: a.textHtml })),
        explanationHtml: opts.revealCorrect ? q.explanationHtml : undefined,
        correctAnswerId: opts.revealCorrect ? answers.find((a) => a.isCorrect)?.id ?? null : undefined,
      };
    });
}

export async function isAnswerCorrect(answerId: string): Promise<boolean> {
  const a = await prisma.answer.findUnique({ where: { id: answerId }, select: { isCorrect: true } });
  return Boolean(a?.isCorrect);
}

export interface ScoreResult {
  total: number;
  correct: number;
  score: number; // 0..100
  passed: boolean;
}

export async function scoreAttempt(attempt: Attempt, test: Test): Promise<ScoreResult> {
  const ids = attempt.questionOrder as string[];
  const total = ids.length || 1;
  const answers = await prisma.attemptAnswer.findMany({ where: { attemptId: attempt.id } });
  const correct = answers.filter((a) => a.isCorrect).length;
  const score = Math.round((correct / total) * 100);
  return {
    total,
    correct,
    score,
    passed: score >= test.passingScore,
  };
}

export function isAttemptExpired(attempt: Attempt, test: Test): boolean {
  if (!test.timeLimitSec) return false;
  const elapsed = (Date.now() - attempt.startedAt.getTime()) / 1000;
  return elapsed > test.timeLimitSec;
}

export function timeLeftSec(attempt: Attempt, test: Test): number | null {
  if (!test.timeLimitSec) return null;
  const elapsed = (Date.now() - attempt.startedAt.getTime()) / 1000;
  return Math.max(0, Math.floor(test.timeLimitSec - elapsed));
}
