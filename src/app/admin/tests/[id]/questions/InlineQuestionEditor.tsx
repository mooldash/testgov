'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QuestionBuilder, type QuestionBuilderHandle } from './QuestionBuilder';
import { deleteQuestion } from '@/app/admin/actions';
import { cn } from '@/lib/utils';

type InitialQuestion = {
  id: string;
  textHtml: string;
  explanationHtml: string;
  mediaUrl: string;
  youtubeId: string;
  order: number;
  answers: { id?: string; textHtml: string; isCorrect: boolean }[];
};

export function InlineQuestionEditor({
  testId,
  mode,
  initial,
}: {
  testId: string;
  mode: 'new' | 'edit';
  initial?: InitialQuestion;
}) {
  const router = useRouter();
  const formRef = useRef<QuestionBuilderHandle>(null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deletePending, startDelete] = useTransition();

  function handleSaved(id: string) {
    if (mode === 'new') {
      router.replace(`/admin/tests/${testId}/questions?question=${id}`);
    } else {
      router.refresh();
    }
  }

  function handleDelete() {
    if (!initial?.id) return;
    if (!confirm('Удалить вопрос?')) return;
    startDelete(async () => {
      await deleteQuestion(initial.id, testId);
      router.replace(`/admin/tests/${testId}/questions`);
    });
  }

  const saveLabel = pending
    ? 'Сохранение…'
    : mode === 'new'
      ? 'Создать вопрос'
      : 'Сохранить';

  return (
    <Card
      key={initial?.id ?? 'new'}
      className={cn(
        'transition-all duration-300',
        saved && 'border-emerald-500 ring-2 ring-emerald-500/40'
      )}
    >
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {mode === 'new' ? 'Новый вопрос' : 'Редактирование вопроса'}
          </h2>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Сохранено
              </span>
            )}
            <Button
              size="sm"
              onClick={() => formRef.current?.submit()}
              disabled={pending}
            >
              {saveLabel}
            </Button>
            {mode === 'edit' && (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
                disabled={deletePending}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Удалить
              </Button>
            )}
          </div>
        </div>
        <QuestionBuilder
          ref={formRef}
          key={initial?.id ?? 'new'}
          testId={testId}
          initial={initial}
          onSaved={handleSaved}
          onPendingChange={setPending}
          onSavedFlagChange={setSaved}
        />
      </CardContent>
    </Card>
  );
}
