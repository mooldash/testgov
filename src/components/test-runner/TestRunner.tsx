'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn, formatDuration } from '@/lib/utils';
import type { TestMode } from '@prisma/client';

export interface RunnerQuestion {
  id: string;
  textHtml: string;
  mediaUrl: string | null;
  youtubeId: string | null;
  answers: Array<{ id: string; textHtml: string }>;
}

interface Props {
  attemptId: string;
  testId: string;
  locale: string;
  mode: TestMode;
  questions: RunnerQuestion[];
  timeLeftSec: number | null;
  requireAnswer: boolean;
}

interface PerQuestionFeedback {
  isCorrect: boolean;
  correctAnswerId: string | null;
}

export function TestRunner(props: Props) {
  const router = useRouter();
  const t = useTranslations();

  const [selected, setSelected] = useState<Record<string, string | null>>({});
  const [feedback, setFeedback] = useState<Record<string, PerQuestionFeedback>>({});
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(props.timeLeftSec);
  const finishedRef = useRef(false);

  const finish = useCallback(async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setSubmitting(true);
    const res = await fetch(`/api/attempts/${props.attemptId}/finish`, { method: 'POST' });
    if (res.ok) {
      router.push(`/${props.locale}/dashboard/attempts/${props.attemptId}`);
    } else {
      finishedRef.current = false;
      setSubmitting(false);
    }
  }, [props.attemptId, props.locale, router]);

  // Countdown timer with auto-submit on expiry
  useEffect(() => {
    if (timeLeft == null) return;
    if (timeLeft <= 0) {
      void finish();
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => (s == null ? null : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, finish]);

  async function submitAnswer(questionId: string, answerId: string | null): Promise<PerQuestionFeedback | null> {
    const res = await fetch(`/api/attempts/${props.attemptId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, answerId }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { isCorrect?: boolean; correctAnswerId?: string | null };
    if (typeof data.isCorrect === 'boolean') {
      return { isCorrect: data.isCorrect, correctAnswerId: data.correctAnswerId ?? null };
    }
    return null;
  }

  const allQuestionsMode = props.mode === 'ALL_QUESTIONS_PAGE';
  const instantMode = props.mode === 'INSTANT_FEEDBACK';
  const allowBack = props.mode === 'CLASSIC_WITH_BACK';

  const total = props.questions.length;

  const TimerBar = (
    <div className="flex items-center justify-between mb-6 sticky top-14 bg-background/90 backdrop-blur py-3 z-30 -mx-4 px-4 border-b">
      <div className="text-sm text-muted-foreground">
        {!allQuestionsMode && t('test.question_n', { n: index + 1, total })}
      </div>
      {timeLeft != null && (
        <div className={cn('text-sm font-mono tabular-nums', timeLeft < 60 && 'text-destructive font-semibold')}>
          ⏱ {t('test.time_left', { time: formatDuration(timeLeft) })}
        </div>
      )}
    </div>
  );

  if (allQuestionsMode) {
    return (
      <div>
        {TimerBar}
        <div className="space-y-6">
          {props.questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              n={i + 1}
              total={total}
              question={q}
              selectedAnswerId={selected[q.id] ?? null}
              feedback={null}
              disabled={false}
              onSelect={(aid) => setSelected((s) => ({ ...s, [q.id]: aid }))}
            />
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Button
            disabled={
              submitting ||
              (props.requireAnswer && props.questions.some((q) => !selected[q.id]))
            }
            onClick={async () => {
              setSubmitting(true);
              for (const q of props.questions) {
                const aid = selected[q.id] ?? null;
                if (aid != null) await submitAnswer(q.id, aid);
              }
              await finish();
            }}
          >
            {t('test.finish')}
          </Button>
        </div>
      </div>
    );
  }

  // CLASSIC, CLASSIC_WITH_BACK, INSTANT_FEEDBACK — one-by-one
  const q = props.questions[index];
  const fb = feedback[q.id] ?? null;
  const isLast = index === total - 1;

  async function handleNext() {
    setSubmitting(true);
    const aid = selected[q.id] ?? null;
    if (aid != null || !props.requireAnswer) {
      const res = await submitAnswer(q.id, aid);
      if (instantMode && res) {
        setFeedback((f) => ({ ...f, [q.id]: res }));
        setSubmitting(false);
        return; // Show feedback first; user clicks again to advance
      }
    }
    setSubmitting(false);
    if (isLast) {
      await finish();
    } else {
      setIndex((i) => i + 1);
    }
  }

  function advanceAfterFeedback() {
    if (isLast) void finish();
    else setIndex((i) => i + 1);
  }

  const showAdvance = instantMode && fb != null;
  const submitDisabled =
    submitting || (props.requireAnswer && selected[q.id] == null);

  return (
    <div>
      {TimerBar}
      <QuestionCard
        n={index + 1}
        total={total}
        question={q}
        selectedAnswerId={selected[q.id] ?? null}
        feedback={fb}
        disabled={fb != null}
        onSelect={(aid) => setSelected((s) => ({ ...s, [q.id]: aid }))}
      />
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="ghost"
          disabled={!allowBack || index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          {t('test.prev')}
        </Button>
        {showAdvance ? (
          <Button onClick={advanceAfterFeedback}>{isLast ? t('test.finish') : t('test.next')}</Button>
        ) : (
          <Button onClick={handleNext} disabled={submitDisabled}>
            {instantMode ? t('test.submit_answer') : isLast ? t('test.finish') : t('test.next')}
          </Button>
        )}
      </div>
    </div>
  );
}

function QuestionCard({
  n,
  total,
  question,
  selectedAnswerId,
  feedback,
  disabled,
  onSelect,
}: {
  n: number;
  total: number;
  question: RunnerQuestion;
  selectedAnswerId: string | null;
  feedback: PerQuestionFeedback | null;
  disabled: boolean;
  onSelect: (answerId: string) => void;
}) {
  const t = useTranslations();
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs text-muted-foreground mb-2">{t('test.question_n', { n, total })}</div>
        <div className="prose-content" dangerouslySetInnerHTML={{ __html: question.textHtml }} />
        {question.mediaUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={question.mediaUrl} alt="" className="mt-3 rounded-lg max-w-full h-auto" />
        )}
        {question.youtubeId && (
          <div className="mt-3 aspect-video">
            <iframe
              className="w-full h-full rounded-lg"
              src={`https://www.youtube.com/embed/${question.youtubeId}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
        <div className="mt-4 space-y-2">
          {question.answers.map((a) => {
            const selected = selectedAnswerId === a.id;
            const isCorrectAnswer = feedback?.correctAnswerId === a.id;
            const isWrongPick = feedback != null && selected && !feedback.isCorrect;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => !disabled && onSelect(a.id)}
                disabled={disabled}
                className={cn(
                  'w-full text-left rounded-lg border px-4 py-3 transition-colors',
                  selected && 'border-primary bg-primary/5',
                  isCorrectAnswer && 'border-success bg-success/10',
                  isWrongPick && 'border-destructive bg-destructive/5',
                  !disabled && !selected && 'hover:bg-muted/50'
                )}
              >
                <span className="prose-content" dangerouslySetInnerHTML={{ __html: a.textHtml }} />
              </button>
            );
          })}
        </div>
        {feedback && (
          <div
            className={cn(
              'mt-4 text-sm font-medium',
              feedback.isCorrect ? 'text-success' : 'text-destructive'
            )}
          >
            {feedback.isCorrect ? '✓ ' + t('test.correct') : '✗ ' + t('test.incorrect')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
