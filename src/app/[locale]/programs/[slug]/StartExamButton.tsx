'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Award, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StartExamButton({
  moduleId,
  programId,
  locale,
  label,
}: {
  moduleId: string;
  programId: string;
  locale: 'ru' | 'kk';
  label: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function start() {
    setPending(true);
    try {
      const res = await fetch('/api/exam/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, programId, locale }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? 'Не удалось запустить экзамен');
        setPending(false);
        return;
      }
      const data = (await res.json()) as { attemptId: string };
      router.push(`/${locale}/exam/${data.attemptId}`);
    } catch {
      setPending(false);
    }
  }

  return (
    <Button
      onClick={start}
      disabled={pending}
      size="lg"
      className="bg-amber-500 hover:bg-amber-600 text-white"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
      ) : (
        <Award className="h-4 w-4 mr-1.5" />
      )}
      {label}
      <ChevronRight className="h-4 w-4 ml-1" />
    </Button>
  );
}
