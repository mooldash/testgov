'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function ApproveStubButton({ orderId, providerRef }: { orderId: string; providerRef: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function approve(status: 'PAID' | 'FAILED') {
    setPending(true);
    const res = await fetch('/api/payments/webhook/stub', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerRef, status, orderId }),
    });
    setPending(false);
    if (!res.ok) {
      alert('Webhook failed');
      return;
    }
    router.push('/ru/dashboard');
  }

  return (
    <div className="flex gap-3 justify-center">
      <Button onClick={() => approve('PAID')} disabled={pending}>Подтвердить оплату</Button>
      <Button onClick={() => approve('FAILED')} disabled={pending} variant="outline">Отклонить</Button>
    </div>
  );
}
