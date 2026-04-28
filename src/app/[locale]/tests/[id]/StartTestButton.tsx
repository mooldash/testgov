'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function StartTestButton({ testId, locale, label }: { testId: string; locale: string; label: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function start() {
    setPending(true);
    const res = await fetch(`/api/tests/${testId}/start`, { method: 'POST' });
    if (!res.ok) {
      setPending(false);
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      alert(data.error ?? 'Could not start test');
      return;
    }
    const data = (await res.json()) as { attemptId: string };
    router.push(`/${locale}/tests/${testId}/run?attempt=${data.attemptId}`);
  }

  return (
    <Button onClick={start} disabled={pending} size="lg">
      {label}
    </Button>
  );
}
