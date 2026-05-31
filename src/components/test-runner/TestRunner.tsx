'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
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
  /** Where to redirect after finish. Defaults to /dashboard/attempts/[id] for auth users. */
  resultPath?: string;
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
      router.push(props.resultPath ?? `/${props.locale}/dashboard/attempts/${props.attemptId}`);
    } else {
      finishedRef.current = false;
      setSubmitting(false);
    }
  }, [props.attemptId, props.locale, props.resultPath, router]);

  // Countdown timer with auto-submit on expiry
  useEffect(() => {
    if (timeLeft == null) return;
    if (timeLeft <= 0) {
      void finish();
      return;
    }
    const id = setTimeout(() => setTimeLeft((s) => (s == null ? null : s - 1)), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, finish]);

  async function submitAnswer(
    questionId: string,
    answerId: string | null
  ): Promise<PerQuestionFeedback | null> {
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
  const lowTime = timeLeft != null && timeLeft < 60;

  const TimerBar = (
    <div className="flex items-center justify-between gap-3 mb-6">
      <div className="text-sm text-muted-foreground">
        {!allQuestionsMode && t('test.question_n', { n: index + 1, total })}
      </div>
      {timeLeft != null && (
        <div
          className={cn(
            'flex items-center gap-1.5 px-3 h-9 rounded-md border tabular-nums font-mono text-sm',
            lowTime
              ? 'border-destructive/40 bg-destructive/10 text-destructive'
              : 'border-border bg-muted/40'
          )}
        >
          <Clock className="h-4 w-4" />
          {formatDuration(timeLeft)}
        </div>
      )}
    </div>
  );

  // ALL_QUESTIONS_PAGE: one big page, no per-question feedback
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
              locked={false}
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

  // INSTANT_FEEDBACK: click answer → immediate green/red feedback → user clicks "next"
  if (instantMode) {
    const q = props.questions[index];
    if (!q) return null;
    const fb = feedback[q.id] ?? null;
    const isLast = index === total - 1;

    async function selectAnswer(aid: string) {
      if (fb) return; // already locked
      setSelected((s) => ({ ...s, [q.id]: aid }));
      const res = await submitAnswer(q.id, aid);
      if (res) setFeedback((f) => ({ ...f, [q.id]: res }));
    }

    return (
      <div>
        {TimerBar}
        <QuestionCard
          n={index + 1}
          total={total}
          question={q}
          selectedAnswerId={selected[q.id] ?? null}
          feedback={fb}
          locked={fb != null}
          onSelect={selectAnswer}
        />
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            {t('test.prev')}
          </Button>
          <Button
            disabled={!fb || submitting}
            onClick={() => {
              if (isLast) void finish();
              else setIndex((i) => i + 1);
            }}
          >
            {isLast ? t('test.finish') : t('test.next')}
          </Button>
        </div>
      </div>
    );
  }

  // CLASSIC / CLASSIC_WITH_BACK: select → click submit/next, no feedback
  const q = props.questions[index];
  if (!q) return null;
  const isLast = index === total - 1;

  async function handleNext() {
    setSubmitting(true);
    const aid = selected[q.id] ?? null;
    if (aid != null || !props.requireAnswer) {
      await submitAnswer(q.id, aid);
    }
    setSubmitting(false);
    if (isLast) {
      await finish();
    } else {
      setIndex((i) => i + 1);
    }
  }

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
        feedback={null}
        locked={false}
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
        <Button onClick={handleNext} disabled={submitDisabled}>
          {isLast ? t('test.finish') : t('test.next')}
        </Button>
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
  locked,
  onSelect,
}: {
  n: number;
  total: number;
  question: RunnerQuestion;
  selectedAnswerId: string | null;
  feedback: PerQuestionFeedback | null;
  /** Once an answer is committed in INSTANT_FEEDBACK mode, lock the buttons. */
  locked: boolean;
  onSelect: (answerId: string) => void;
}) {
  const t = useTranslations();
  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-6 pb-6 px-6 space-y-4">
        <div className="text-xs text-muted-foreground">
          {t('test.question_n', { n, total })}
        </div>
        <div
          className="prose-content text-base"
          dangerouslySetInnerHTML={{ __html: question.textHtml }}
        />
        {question.mediaUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={question.mediaUrl} alt="" className="rounded-lg max-w-full h-auto" />
        )}
        {question.youtubeId && (
          <div className="aspect-video">
            <iframe
              className="w-full h-full rounded-lg"
              src={`https://www.youtube.com/embed/${question.youtubeId}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
        <div className="space-y-2 pt-1">
          {question.answers.map((a) => {
            const isSelected = selectedAnswerId === a.id;
            const showCorrect = feedback && feedback.correctAnswerId === a.id;
            const showWrong = feedback && isSelected && !feedback.isCorrect;
            // While we're waiting for INSTANT_FEEDBACK response, don't show the
            // primary "selected" state — it would briefly flash dark before
            // turning green/red. Keep the row neutral until feedback arrives.
            const pendingFeedback = locked && !feedback;
            const showSelectedHint = isSelected && !pendingFeedback && !feedback;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => !locked && onSelect(a.id)}
                disabled={locked}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-lg border transition-colors',
                  'flex items-center gap-3',
                  showCorrect
                    ? 'border-emerald-500/60 bg-emerald-500/10'
                    : showWrong
                      ? 'border-destructive/60 bg-destructive/10'
                      : showSelectedHint
                        ? 'border-primary/60 bg-primary/5'
                        : 'border-border hover:border-primary/40 hover:bg-muted/40',
                  feedback && !showCorrect && !showWrong && 'opacity-60'
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                    showCorrect
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : showWrong
                        ? 'border-destructive bg-destructive text-white'
                        : showSelectedHint
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                  )}
                >
                  {showCorrect && <CheckCircle2 className="h-3 w-3" />}
                  {showWrong && <XCircle className="h-3 w-3" />}
                </span>
                <span
                  className="prose-content text-sm flex-1 [&_p]:mb-0"
                  dangerouslySetInnerHTML={{ __html: a.textHtml }}
                />
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
