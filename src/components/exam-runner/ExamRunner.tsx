'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award, Clock, CheckCircle2, XCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    if (feedback[questionId]) return; // already answered & locked
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
    } catch {
      // network error — keep selection optimistic
    }
  }

  const chapter = props.chapters[currentChapter];

  // Per-chapter progress numbers
  function chapterStats(idx: number) {
    const ch = props.chapters[idx];
    if (!ch) return { ans: 0, total: 0 };
    const ans = ch.questions.filter((q) => selected[q.id] != null).length;
    return { ans, total: ch.questions.length };
  }

  const lowTime = timeLeft != null && timeLeft < 300; // <5 min

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
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
          <Button
            onClick={finish}
            disabled={submitting}
            variant={answered === total ? 'default' : 'outline'}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : null}
            {isKk ? 'Аяқтау' : 'Завершить'}
          </Button>
        </div>
      </div>

      {/* Chapter tabs (scroll-x on small screens) */}
      <div className="border-b mb-6 -mx-4 md:mx-0">
        <div className="flex gap-1 overflow-x-auto px-4 md:px-0 pb-px">
          {props.chapters.map((ch, idx) => {
            const s = chapterStats(idx);
            const active = idx === currentChapter;
            const done = s.ans === s.total && s.total > 0;
            return (
              <button
                key={ch.testId + idx}
                type="button"
                onClick={() => setCurrentChapter(idx)}
                className={cn(
                  'shrink-0 px-3 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors',
                  active
                    ? 'border-primary text-foreground font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={cn(
                      'inline-flex h-5 min-w-5 px-1 items-center justify-center rounded text-[10px] font-semibold tabular-nums',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : done
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span className="max-w-[220px] truncate">{ch.testTitle}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {s.ans}/{s.total}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chapter content */}
      {chapter && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 mb-1">
            <div>
              <Badge variant="outline" className="text-[10px] mb-2">
                {isKk ? 'Чаптер' : 'Чаптер'} {currentChapter + 1} / {props.chapters.length}
              </Badge>
              <h2 className="text-xl md:text-2xl font-semibold">{chapter.testTitle}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isKk
                  ? `${chapter.questions.length} сұрақ`
                  : `${chapter.questions.length} вопросов`}
              </p>
            </div>
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
                      return (
                        <button
                          key={a.id}
                          type="button"
                          disabled={Boolean(fb)}
                          onClick={() => selectAnswer(q.id, a.id)}
                          className={cn(
                            'w-full text-left px-4 py-3 rounded-lg border transition-colors',
                            'flex items-center gap-3',
                            showCorrect
                              ? 'border-emerald-500/60 bg-emerald-500/10 text-foreground'
                              : showWrong
                                ? 'border-destructive/60 bg-destructive/10 text-foreground'
                                : isSelected
                                  ? 'border-primary/60 bg-primary/5'
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
                                  : isSelected
                                    ? 'border-primary bg-primary text-primary-foreground'
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

          {/* Bottom chapter nav */}
          <div className="flex items-center justify-between pt-4 gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentChapter((i) => Math.max(0, i - 1))}
              disabled={currentChapter === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {isKk ? 'Алдыңғы' : 'Предыдущий'}
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentChapter + 1} / {props.chapters.length}
            </span>
            {currentChapter < props.chapters.length - 1 ? (
              <Button onClick={() => setCurrentChapter((i) => i + 1)}>
                {isKk ? 'Келесі' : 'Следующий'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={finish} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                {isKk ? 'Емтиханды аяқтау' : 'Завершить экзамен'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
