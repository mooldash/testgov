import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
  name: z.string().max(120).optional(),
  phone: z
    .string()
    .min(7, 'Введите номер телефона')
    .max(32)
    // Allow +, digits, spaces, parens, dashes
    .regex(/^[+\d][\d\s()-]{6,31}$/, 'Неверный формат номера'),
  localePref: z.enum(['KK', 'RU']).default('RU'),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }
  const { email, password, name, phone, localePref } = parsed.data;
  const normalized = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email: normalized, passwordHash, name: name || null, phone, localePref },
  });
  return NextResponse.json({ ok: true });
}
