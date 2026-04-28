'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { deleteQuestion } from '@/app/admin/actions';

export function DeleteQuestionButton({ id, testId }: { id: string; testId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() => {
        if (!confirm('Удалить вопрос?')) return;
        start(() => deleteQuestion(id, testId));
      }}
    >
      Удалить
    </Button>
  );
}
