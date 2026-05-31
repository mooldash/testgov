'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface RunnerAnswer {
  id: string;
  textHtml: string;
}

export interface RunnerQuestion {
  id: string;
  textHtml: string;
  answers: RunnerAnswer[];
}

export interface RunnerChapter {
  testId: string;
  testTitle: string;
  questions: RunnerQuestion[];
}

interface Feedback {
  isCorrect: boolean;
  correctAnswerId: string | null;
}

interface Props {
  attemptId: string;
  locale: 'ru' | 'kk';
  chapters: RunnerChapter[];
  timeLeftSec: number | null;
  resultPath: string;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ExamRunner(props: Props) {
  const router = useRouter();
  const isKk = props.locale === 'kk';

  const [currentChapter, setCurrentChapter] = useState(0);
  const [selected, setSelected] = useState<Record<string, string | null>>({});
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(props.timeLeftSec);
  const finishedRef = useRef(false);

  const total = props.chapters.reduce((s, c) => s + c.questions.length, 0);
  const answered = Object.keys(selected).filter((qid) => selected[qid] != null).length;
  const correct = Object.values(feedback).filter((f) => f.isCorrect).length;

  const finish = useCallback(async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setSubmitting(true);
    const res = await fetch(`/api/exam/${props.attemptId}/finish`, { method: 'POST' });
    if (res.ok) {
      router.push(props.resultPath);
    } else {
      finishedRef.current = false;
      setSubmitting(false);
    }
  }, [props.attemptId, props.resultPath, router]);

  // Timer
  useEffect(() => {
    if (timeLeft == null) return;
    if (timeLeft <= 0) {
      void finish();
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => (t == null ? null : t - 1)), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, finish]);

  async function selectAnswer(questionId: string, answerId: string) {
    if (feedback[questionId]) return;
    setSelected((prev) => ({ ...prev, [questionId]: answerId }));
    try {
      const res = await fetch(`/api/exam/${props.attemptId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, answerId }),
      });
      if (res.ok) {
        const data = (await res.json()) as Feedback;
        setFeedback((prev) => ({ ...prev, [questionId]: data }));
      }
    } catch {}
  }

  const chapter = props.chapters[currentChapter];

  // Per-chapter stats
  const chapterStats = useMemo(() => {
    return props.chapters.map((ch) => {
      const ans = ch.questions.filter((q) => selected[q.id] != null).length;
      const ok = ch.questions.filter((q) => feedback[q.id]?.isCorrect).length;
      return {
        total: ch.questions.length,
        answered: ans,
        correct: ok,
        done: ans === ch.questions.length && ch.questions.length > 0,
      };
    });
  }, [props.chapters, selected, feedback]);

  const currentStats = chapterStats[currentChapter];
  const chapterComplete = currentStats?.done ?? false;
  const lowTime = timeLeft != null && timeLeft < 300;
  const isLastChapter = currentChapter === props.chapters.length - 1;

  function goNext() {
    if (isLastChapter) void finish();
    else setCurrentChapter((i) => i + 1);
  }

  function goPrev() {
    setCurrentChapter((i) => Math.max(0, i - 1));
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 lg:p-10">
      {/* Top status bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 shrink-0">
            <Award className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">
              {isKk ? 'Қорытынды емтихан' : 'Итоговый экзамен'}
            </div>
            <div className="font-semibold text-sm">
              {isKk
                ? `Жауап: ${answered} / ${total}`
                : `Отвечено: ${answered} / ${total}`}
              {' · '}
              <span className="text-emerald-600 dark:text-emerald-400">
                {isKk ? 'дұрыс' : 'верно'}: {correct}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
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
              {formatTime(timeLeft)}
            </div>
          )}
          <Button onClick={finish} disabled={submitting} variant="outline">
            {submitting ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
            {isKk ? 'Аяқтау' : 'Завершить'}
          </Button>
        </div>
      </div>

      {/* Step indicator (replaces horizontal-scroll tabs) */}
      <StepIndicator
        stats={chapterStats}
        current={currentChapter}
        onPick={setCurrentChapter}
      />

      {/* Chapter content */}
      {chapter && (
        <div className="space-y-4 mt-6">
          <div className="mb-2">
            <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              {isKk ? 'Чаптер' : 'Чаптер'} {currentChapter + 1} / {props.chapters.length}
            </div>
            <h2 className="text-xl md:text-2xl font-semibold mt-1">{chapter.testTitle}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isKk
                ? `${chapter.questions.length} сұрақ`
                : `${chapter.questions.length} вопросов`}
            </p>
          </div>

          {chapter.questions.map((q, qIdx) => {
            const userAnswer = selected[q.id];
            const fb = feedback[q.id];
            return (
              <Card key={q.id} className="overflow-hidden">
                <CardContent className="pt-5 pb-5 px-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-mono text-muted-foreground mt-1 shrink-0">
                      {String(qIdx + 1).padStart(2, '0')}
                    </span>
                    <div
                      className="prose-content text-sm flex-1"
                      dangerouslySetInnerHTML={{ __html: q.textHtml }}
                    />
                  </div>

                  <div className="space-y-2 ml-7">
                    {q.answers.map((a) => {
                      const isSelected = userAnswer === a.id;
                      const showCorrect = fb && fb.correctAnswerId === a.id;
                      const showWrong = fb && isSelected && !fb.isCorrect;
                      // Don't flash primary "selected" state between click and
                      // feedback arrival — keep the row neutral until server
                      // responds with green/red.
                      return (
                        <button
                          key={a.id}
                          type="button"
                          disabled={Boolean(fb) || (isSelected && !fb)}
                          onClick={() => selectAnswer(q.id, a.id)}
                          className={cn(
                            'w-full text-left px-4 py-3 rounded-lg border transition-colors',
                            'flex items-center gap-3',
                            showCorrect
                              ? 'border-emerald-500/60 bg-emerald-500/10'
                              : showWrong
                                ? 'border-destructive/60 bg-destructive/10'
                                : 'border-border hover:border-primary/40 hover:bg-muted/40',
                            fb && !showCorrect && !showWrong && 'opacity-60'
                          )}
                        >
                          <span
                            className={cn(
                              'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                              showCorrect
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : showWrong
                                  ? 'border-destructive bg-destructive text-white'
                                  : 'border-muted-foreground/30'
                            )}
                          >
                            {showCorrect && <CheckCircle2 className="h-3 w-3" />}
                            {showWrong && <XCircle className="h-3 w-3" />}
                          </span>
                          <span
                            className="text-sm flex-1"
                            dangerouslySetInnerHTML={{ __html: a.textHtml }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Inline chapter result — appears once all questions answered */}
          {chapterComplete && currentStats && (
            <ChapterResultCard
              correct={currentStats.correct}
              total={currentStats.total}
              isLast={isLastChapter}
              isKk={isKk}
              onNext={goNext}
              submitting={submitting}
            />
          )}

          {/* Bottom nav (always visible) */}
          <div className="flex items-center justify-between pt-4 gap-3">
            <Button variant="outline" onClick={goPrev} disabled={currentChapter === 0}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {isKk ? 'Алдыңғы' : 'Предыдущий'}
            </Button>
            <span className="text-sm text-muted-foreground tabular-nums">
              {currentChapter + 1} / {props.chapters.length}
            </span>
            {isLastChapter ? (
              <Button onClick={finish} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                {isKk ? 'Емтиханды аяқтау' : 'Завершить экзамен'}
              </Button>
            ) : (
              <Button onClick={goNext}>
                {isKk ? 'Келесі' : 'Следующий'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Step indicator: dots with numbers and connecting lines.
 * - Active chapter: large primary dot with number
 * - Done chapter: emerald with check
 * - Pending: muted bordered dot
 * No horizontal scroll: dots compress, names move into a single header line.
 */
function StepIndicator({
  stats,
  current,
  onPick,
}: {
  stats: Array<{ done: boolean; answered: number; total: number; correct: number }>;
  current: number;
  onPick: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-1 w-full">
      {stats.map((s, i) => {
        const active = i === current;
        const done = s.done;
        const isFirst = i === 0;
        return (
          <div key={i} className={cn('flex items-center', !isFirst && 'flex-1')}>
            {!isFirst && (
              <div
                className={cn(
                  'h-0.5 flex-1 transition-colors',
                  i <= current || done ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
            <button
              type="button"
              onClick={() => onPick(i)}
              title={`Чаптер ${i + 1}${s.total > 0 ? ` (${s.answered}/${s.total})` : ''}`}
              className={cn(
                'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all',
                active
                  ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110'
                  : done
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-muted text-muted-foreground border border-border hover:border-primary/60 hover:text-foreground'
              )}
            >
              {done && !active ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </button>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Inline result card shown when all questions of the current chapter have
 * been answered. Encourages the user to move on and gives them their
 * mini-score for this chapter.
 */
function ChapterResultCard({
  correct,
  total,
  isLast,
  isKk,
  onNext,
  submitting,
}: {
  correct: number;
  total: number;
  isLast: boolean;
  isKk: boolean;
  onNext: () => void;
  submitting: boolean;
}) {
  const pct = total === 0 ? 0 : Math.round((correct / total) * 100);
  const good = pct >= 60;
  return (
    <div
      className={cn(
        'rounded-xl border-2 p-5 mt-2',
        good
          ? 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30'
          : 'border-amber-500/40 bg-amber-50 dark:bg-amber-950/30'
      )}
    >
      <div className="flex items-center gap-4 flex-wrap">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
            good
              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
              : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
          )}
        >
          {good ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">
            {isKk ? 'Чаптер аяқталды' : 'Чаптер пройден'}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {isKk
              ? `Дұрыс жауаптар: ${correct} / ${total} (${pct}%)`
              : `Правильных ответов: ${correct} / ${total} (${pct}%)`}
          </div>
        </div>
        <Button onClick={onNext} disabled={submitting} className="shrink-0">
          {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
          {isLast
            ? isKk
              ? 'Емтиханды аяқтау'
              : 'Завершить экзамен'
            : isKk
              ? 'Келесі чаптер'
              : 'Следующий чаптер'}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
