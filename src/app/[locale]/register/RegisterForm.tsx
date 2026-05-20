'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Auto-format input as a Kazakh phone number.
 * Strips non-digits, normalizes leading 8 → 7, prepends 7 if missing,
 * caps at 11 digits, formats as `+7 NNN NNN NN NN`.
 */
function formatKzPhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('8')) digits = '7' + digits.slice(1);
  if (digits.length > 0 && !digits.startsWith('7')) digits = '7' + digits;
  digits = digits.slice(0, 11);
  if (digits.length === 0) return '';
  let out = '+7';
  if (digits.length > 1) out += ' ' + digits.slice(1, 4);
  if (digits.length > 4) out += ' ' + digits.slice(4, 7);
  if (digits.length > 7) out += ' ' + digits.slice(7, 9);
  if (digits.length > 9) out += ' ' + digits.slice(9, 11);
  return out;
}

export function RegisterForm({
  labels,
  locale,
}: {
  labels: {
    name: string;
    email: string;
    password: string;
    phone: string;
    submit: string;
    failed: string;
  };
  locale: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [phone, setPhone] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email'));
    const password = String(fd.get('password'));

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        name: String(fd.get('name') ?? ''),
        phone,
        localePref: locale === 'kk' ? 'KK' : 'RU',
      }),
    });
    if (!res.ok) {
      setPending(false);
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? labels.failed);
      return;
    }
    const sign = await signIn('credentials', { email, password, redirect: false });
    setPending(false);
    if (sign?.error) {
      setError(labels.failed);
      return;
    }
    router.push(`/${locale}/dashboard`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{labels.name}</Label>
        <Input id="name" name="name" type="text" autoComplete="name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{labels.email}</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">{labels.phone}</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          required
          autoComplete="tel"
          placeholder="+7 7XX XXX XX XX"
          value={phone}
          onChange={(e) => setPhone(formatKzPhone(e.target.value))}
          pattern="^\+7 7\d{2} \d{3} \d{2} \d{2}$"
          title={locale === 'kk' ? 'Формат: +7 7XX XXX XX XX' : 'Формат: +7 7XX XXX XX XX'}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{labels.password}</Label>
        <Input id="password" name="password" type="password" required minLength={6} autoComplete="new-password" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {labels.submit}
      </Button>
    </form>
  );
}
