'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { deleteTest } from '@/app/admin/actions';

export function TestRow({
  id, title, locale, mode, questionsCount,
}: { id: string; title: string; locale: 'KK' | 'RU'; mode: string; questionsCount: number }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center justify-between border rounded-md p-3">
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted-foreground flex gap-2 mt-1">
          <Badge variant="outline">{locale}</Badge>
          <Badge variant="secondary">{mode}</Badge>
          <span>· вопросов: {questionsCount}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Link href={`/admin/tests/${id}/questions`}><Button size="sm" variant="outline">Вопросы</Button></Link>
        <Link href={`/admin/tests/${id}/settings`}><Button size="sm" variant="outline">Настройки</Button></Link>
        <Button
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() => {
            if (!confirm('Удалить тест?')) return;
            start(() => deleteTest(id));
          }}
        >
          ×
        </Button>
      </div>
    </div>
  );
}
