'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function BuyButton({
  programId,
  priceLabel,
  locale,
  authed,
}: {
  programId: string;
  priceLabel: string;
  locale: string;
  authed: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleBuy() {
    if (!authed) {
      router.push(`/${locale}/login`);
      return;
    }
    setPending(true);
    const res = await fetch('/api/payments/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ programId }),
    });
    setPending(false);
    if (!res.ok) {
      alert('Payment error');
      return;
    }
    const data = (await res.json()) as { redirectUrl: string };
    router.push(data.redirectUrl);
  }

  return (
    <Button onClick={handleBuy} disabled={pending}>
      {priceLabel}
    </Button>
  );
}
