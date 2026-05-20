'use client';

import { forwardRef, useEffect, useImperativeHandle, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TipTapEditor } from '@/components/editor/TipTapEditor';
import { saveQuestion } from '@/app/admin/actions';
import { cn } from '@/lib/utils';

interface AnswerDraft {
  id?: string;
  textHtml: string;
  isCorrect: boolean;
}

interface Initial {
  id: string;
  textHtml: string;
  explanationHtml: string;
  mediaUrl: string;
  youtubeId: string;
  order: number;
  answers: AnswerDraft[];
}

const EMPTY: Initial = {
  id: '',
  textHtml: '',
  explanationHtml: '',
  mediaUrl: '',
  youtubeId: '',
  order: 0,
  answers: [
    { textHtml: '', isCorrect: false },
    { textHtml: '', isCorrect: false },
  ],
};

export interface QuestionBuilderHandle {
  submit: () => void;
}

interface Props {
  testId: string;
  initial?: Initial;
  onSaved?: (id: string) => void;
  onPendingChange?: (pending: boolean) => void;
  onSavedFlagChange?: (saved: boolean) => void;
}

export const QuestionBuilder = forwardRef<QuestionBuilderHandle, Props>(function QuestionBuilder(
  { testId, initial, onSaved, onPendingChange, onSavedFlagChange },
  ref
) {
  const isEdit = Boolean(initial?.id);
  const [state, setState] = useState<Initial>(initial ?? EMPTY);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    onPendingChange?.(pending);
  }, [pending, onPendingChange]);

  useEffect(() => {
    onSavedFlagChange?.(saved);
  }, [saved, onSavedFlagChange]);

  function setAnswer(i: number, patch: Partial<AnswerDraft>) {
    setState((s) => ({ ...s, answers: s.answers.map((a, j) => (j === i ? { ...a, ...patch } : a)) }));
  }
  function addAnswer() {
    setState((s) => ({ ...s, answers: [...s.answers, { textHtml: '', isCorrect: false }] }));
  }
  function removeAnswer(i: number) {
    setState((s) => ({ ...s, answers: s.answers.filter((_, j) => j !== i) }));
  }
  function setSingleCorrect(i: number) {
    setState((s) => ({ ...s, answers: s.answers.map((a, j) => ({ ...a, isCorrect: j === i })) }));
  }

  function submit() {
    const valid =
      state.textHtml.trim().length > 0 &&
      state.answers.length >= 2 &&
      state.answers.every((a) => a.textHtml.trim().length > 0) &&
      state.answers.some((a) => a.isCorrect);
    if (!valid) {
      alert('Заполните вопрос, минимум 2 ответа и отметьте правильный.');
      return;
    }
    const payload = {
      id: isEdit ? state.id : undefined,
      testId,
      textHtml: state.textHtml,
      explanationHtml: state.explanationHtml || undefined,
      mediaUrl: state.mediaUrl || null,
      youtubeId: extractYouTubeId(state.youtubeId) || null,
      order: state.order,
      answers: state.answers.map((a, i) => ({
        id: a.id,
        textHtml: a.textHtml,
        isCorrect: a.isCorrect,
        order: i,
      })),
    };
    start(async () => {
      const result = await saveQuestion(payload);
      setSaved(true);
      if (!isEdit) setState(EMPTY);
      onSaved?.(result.id);
    });
  }

  useImperativeHandle(ref, () => ({ submit }));

  const saveLabel = pending ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Создать вопрос';

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Текст вопроса</Label>
        <TipTapEditor value={state.textHtml} onChange={(html) => setState((s) => ({ ...s, textHtml: html }))} />
      </div>

      <div className="space-y-1.5">
        <Label>YouTube URL или ID (опционально)</Label>
        <Input
          value={state.youtubeId}
          onChange={(e) => setState((s) => ({ ...s, youtubeId: e.target.value }))}
          placeholder="https://youtu.be/… или dQw4w9WgXcQ"
        />
      </div>

      <div className="space-y-2">
        <Label>Ответы (отметьте правильный)</Label>
        {state.answers.map((a, i) => (
          <div
            key={i}
            className={cn(
              'border rounded-md p-2 flex gap-2 items-start',
              a.isCorrect && 'border-success bg-success/5'
            )}
          >
            <input
              type="radio"
              name={`correct-${state.id || 'new'}`}
              checked={a.isCorrect}
              onChange={() => setSingleCorrect(i)}
              className="mt-3 h-4 w-4"
            />
            <div className="flex-1">
              <TipTapEditor value={a.textHtml} onChange={(html) => setAnswer(i, { textHtml: html })} />
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => removeAnswer(i)}
              disabled={state.answers.length <= 2}
            >
              ×
            </Button>
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" onClick={addAnswer}>
          + Ответ
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label>Объяснение (опционально, показывается после ответа)</Label>
        <TipTapEditor
          value={state.explanationHtml}
          onChange={(html) => setState((s) => ({ ...s, explanationHtml: html }))}
        />
      </div>

      <div className="flex items-center gap-3 pt-2 border-t">
        <Button onClick={submit} disabled={pending}>
          {saveLabel}
        </Button>
        {saved && <span className="text-sm text-success">✓ Сохранено</span>}
      </div>
    </div>
  );
});

function extractYouTubeId(input: string): string | null {
  if (!input) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(input.trim())) return input.trim();
  const m = input.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
