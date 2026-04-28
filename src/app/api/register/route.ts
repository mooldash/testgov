import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
  name: z.string().max(120).optional(),
  localePref: z.enum(['KK', 'RU']).default('RU'),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const { email, password, name, localePref } = parsed.data;
  const normalized = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email: normalized, passwordHash, name: name || null, localePref },
  });
  return NextResponse.json({ ok: true });
}
